// npm imports
import castArray from 'lodash.castarray';
import cloneDeepWith from 'lodash.clonedeepwith';
import get from 'lodash.get';
import invoke from 'lodash.invoke';
import isArrayLikeObject from 'lodash.isarraylikeobject';
import isObject from 'lodash.isobject';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import isUndefined from 'lodash.isundefined';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import set from 'lodash.set';
import size from 'lodash.size';
import sortBy from 'lodash.sortby';
import { nanoid } from 'nanoid';

const getJsonFns = () => {
  const seen = new WeakSet();
  const undefinedToken = nanoid();

  const replacer = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return 'CIRCULAR REFERENCE';
      }
      seen.add(value);

      if (!isArrayLikeObject(value))
        return Object.getOwnPropertyNames(value).reduce(
          (v, p) => ({ ...v, [p]: value[p] }),
          {}
        );
    }
    return isUndefined(value) ? undefinedToken : value;
  };

  const reviver = (key, value) =>
    value === undefinedToken ? undefined : value;

  return { replacer, reviver };
};

/**
 * JsonMap class to apply transformations to a JSON object
 */
class JsonMap {
  /**
   * Creates an instance of JsonMap.
   *
   * @param {object} [map] - The data mapping configuration.
   * @param {object} [lib] - A collection of function libraries.
   * @param {string} [ignore] - Regex pattern of keys to ignore. Defaults to '^\\$'.
   */
  constructor(map = {}, lib = {}, ignore = '^\\$') {
    this.map = map;
    this.lib = lib;
    this.ignore = new RegExp(ignore);
  }

  /**
   * Transforms the input data according to the map configuration.
   *
   * @param {object} input - The input data to be transformed.
   * @return {object} - The transformed data.
   */
  async transform(input) {
    // Sets the input data and initializes an empty output object
    this.input = input;
    this.output = {};

    // Perform transformation & eliminate recursion from result.
    const { replacer, reviver } = getJsonFns();
    const result = JSON.parse(
      JSON.stringify(
        await this.#transform(this.map, this.input, this.output),
        replacer
      ),
      reviver
    );

    // Recursively eliminate non-string keys & string keys starting with $ and not in ignoreExclusions.
    const deep = (value) =>
      isPlainObject(value)
        ? mapValues(
            pickBy(value, (v, k) => !this.ignore.test(k)),
            (value) => cloneDeepWith(value, deep)
          )
        : undefined;

    return cloneDeepWith(result, deep);
  }

  /**
   * Recursive function to handle transformations.
   *
   * @param {object} node - The current map node.
   * @param {object} input - The current input node.
   * @param {object} output - The current output node.
   * @param {string} path - The path to the current node.
   * @return {object} - The transformed node.
   * @private
   */
  async #transform(node, input, output, path = '') {
    // console.debug('#transform params:\n', { node, input, output, path });

    // Checks if the current node is an object and has a '$' key
    if (isPlainObject(node) && size(node) === 1 && '$' in node) {
      // Retrieves the transformations to be applied (can be an array or a single object)
      const transformations = castArray(node['$']);
      // console.debug('transformations:\n', transformations);

      // Array to store the results of the transformations
      let results = [];

      // Iterates over each transformation
      for (const transformation of transformations) {
        // console.debug('processing transformation:\n', transformation);

        // Resolves the object path for the transformation
        const { obj: methodObj, path: methodPath } = this.#resolvePath(
          transformation.method,
          results
        );
        // console.debug('methodObj:\n', methodObj, '\nmethodPath:\n', methodPath);

        // Resolves the parameter paths for the transformation
        const params = castArray(transformation.params).map((param) => {
          const { obj: paramObj, path: paramPath } = this.#resolvePath(
            param,
            results
          );
          return paramObj
            ? paramPath
              ? get(paramObj, paramPath)
              : paramObj
            : paramPath;
        });
        // console.debug('resolved transformation params:\n', params);

        // Calls the specified method on the resolved object with the resolved parameters
        const result = await invoke(methodObj, methodPath, ...params);
        // console.debug('transformation result:\n', result);

        // Stores the result of the transformation
        results.unshift(result);
      }

      // Sets the output at the specified path to the last result of the transformations & returns.
      set(output, path, results[0]);
      // console.debug('updated output:\n', output);

      return results[0];
    }

    // Checks if the current node is an object
    if (isObject(node)) {
      // Creates an empty array or object based on whether the current node is an array or not
      const transformedNode = Array.isArray(node) ? [] : {};

      // Iterates over each key-value pair in the current node in ascending order by key
      for (const [key, value] of sortBy(Object.entries(node), ([key]) => key)) {
        // Constructs the current path by appending the current key to the previous path (if any)
        const currentPath = path ? `${path}.${key}` : key;

        // Recursively calls #transform with the current value, input, output, and path
        // Assigns the transformed value to the corresponding key in the transformedNode
        transformedNode[key] = await this.#transform(
          value,
          input,
          output,
          currentPath
        );
      }

      // Sets the output at the specified path to the transformedNode & returnsd.
      set(output, path, transformedNode);
      return transformedNode;
    }

    // Sets the output at the specified path to the current node & returns.
    set(output, path, node);
    return node;
  }

  /**
   * @typedef {object} PathResolution
   * @property {object} obj - The object to be used for the transformation.
   * @property {string} path - The path to the value to be used for the transformation.
   * @private
   */

  /**
   * Resolves the method/params path for a transformation
   *
   * @param {string} path - The path to be resolved.
   * @param {Array} results - The results from previous transformations.
   * @return {PathResolution} - The resolved path.
   * @private
   */
  #resolvePath(path, results) {
    // If the path is not a string, return it as is
    if (!isString(path)) {
      return { path };
    }

    // Defines special patterns and their corresponding resolution functions
    const patterns = {
      '^\\$\\.(?<obj>lib|input|output)\\.?(?<path>.*)': ({ obj, path }) => ({
        obj: this[obj],
        path,
      }),
      '^\\$(?<path>\\[\\d+\\].*)': ({ path }) => ({
        obj: results,
        path,
      }),
    };

    // Iterates over the special patterns
    for (const [pattern, resolve] of Object.entries(patterns)) {
      const match = path.match(pattern);
      if (match) return resolve(match.groups);
    }

    // Returns the path as is if it does not match any special patterns
    return { path };
  }
}

// Exports the JsonMap class as the default export of this module
export { JsonMap };
