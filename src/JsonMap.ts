import _ from 'lodash';
import { nanoid } from 'nanoid';

import type {
  Json,
  JsonFn,
  JsonMapLib,
  JsonMapMap,
  JsonMapOptions,
  JsonMapTransform,
  PathResolutionMap,
  PathResolutionParams,
} from './types';
import { logger } from './util/logger';

// The transformation process leverages JSON.stringify and JSON.parse to eliminate circular references.
const getJsonFns = () => {
  const seen = new WeakSet();
  const undefinedToken = nanoid();

  const replacer: JsonFn = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return 'CIRCULAR REFERENCE';
      }
      seen.add(value);

      if (!_.isArrayLikeObject(value))
        return Object.getOwnPropertyNames(value).reduce(
          (v, p) => ({
            ...v,
            [p]: (value as Record<string, unknown>)[p],
          }),
          {},
        );
    }
    return _.isUndefined(value) ? undefinedToken : value;
  };

  const reviver: JsonFn = (key, value) =>
    value === undefinedToken ? undefined : value;

  return { replacer, reviver };
};

/**
 * JsonMap class to apply transformations to a JSON object
 */
class JsonMap {
  private ignore: RegExp;
  private input: Json | undefined;
  private output: Json | undefined;

  constructor(
    private map: JsonMapMap = {},
    private lib: JsonMapLib = {},
    { ignore = /^\$/ }: JsonMapOptions = {},
  ) {
    this.ignore = _.isString(ignore) ? new RegExp(ignore) : ignore;
  }

  /**
   * Transforms the input data according to the map configuration.
   */
  async transform(input: Json) {
    // Sets the input data and initializes an empty output object
    this.input = input;
    this.output = {};

    // Perform transformation & eliminate recursion from result.
    const { replacer, reviver } = getJsonFns();
    const result = JSON.parse(
      JSON.stringify(
        await this.#transform(this.map, this.input, this.output),
        replacer,
      ),
      reviver,
    ) as Json;

    // Recursively eliminate non-string keys & string keys starting with $ and not in ignoreExclusions.
    const deep = (value: Json | undefined): Json | undefined =>
      value instanceof Object && !_.isArray(value)
        ? _.mapValues(
            _.pickBy(value, (v, k) => !this.ignore.test(k)),
            (value) => _.cloneDeepWith(value, deep) as typeof value,
          )
        : undefined;

    return _.cloneDeepWith(result, deep) as Json;
  }

  /**
   * Recursive function to handle transformations.
   */
  async #transform(
    node: JsonMapMap,
    input: Json,
    output: Json,
    path = '',
  ): Promise<Json> {
    logger.debug('#transform params:\n', { node, input, output, path });

    // Checks if the current node is an object and has only a '$' key
    if (node instanceof Object && _.size(node) === 1 && '$' in node) {
      // Retrieves the transformations to be applied (can be an array or a single object)
      const transformations = _.castArray(
        node.$ as JsonMapTransform | JsonMapTransform[],
      );
      logger.debug('transformations:\n', transformations);

      // Array to store the results of the transformations
      const results: Json = [];

      // Iterates over each transformation
      for (const transformation of transformations) {
        logger.debug('processing transformation:\n', transformation);

        // Resolves the object path for the transformation
        const { obj: methodObj, path: methodPath } = this.#resolvePath(
          transformation.method,
          results,
        );

        // Resolves the parameter paths for the transformation
        const params = _.castArray(transformation.params).map<unknown>(
          (param) => {
            const { obj: paramObj, path: paramPath } = this.#resolvePath(
              param,
              results,
            );

            return paramObj
              ? paramPath
                ? _.get(paramObj, paramPath as string)
                : paramObj
              : paramPath;
          },
        );

        logger.debug('resolved transformation params:\n', params);

        // Calls the specified method on the resolved object with the resolved parameters
        const result = (await _.invoke(
          methodObj,
          methodPath as string,
          ...params,
        )) as Json;

        logger.debug('transformation result:\n', result);

        // Stores the result of the transformation
        results.unshift(result);
      }

      // Sets the output at the specified path to the last result of the transformations & returns.
      _.set(output as object, path, results[0]);

      logger.debug('updated output:\n', output);

      return results[0];
    }

    // Checks if the current node is an object
    if (_.isObject(node)) {
      // Creates an empty array or object based on whether the current node is an array or not
      const transformedNode = (Array.isArray(node) ? [] : {}) as Record<
        string,
        Json
      >;

      // Iterates over each key-value pair in the current node in ascending order by key
      for (const [key, value] of _.sortBy(
        Object.entries(node),
        ([key]) => key,
      )) {
        // Constructs the current path by appending the current key to the previous path (if any)
        const currentPath = path ? `${path}.${key}` : key;

        // Recursively calls #transform with the current value, input, output, and path
        // Assigns the transformed value to the corresponding key in the transformedNode
        transformedNode[key] = await this.#transform(
          value,
          input,
          output,
          currentPath,
        );
      }

      // Sets the output at the specified path to the transformedNode & returnsd.
      _.set(output as object, path, transformedNode);
      return transformedNode;
    }

    // Sets the output at the specified path to the current node & returns.
    _.set(output as object, path, node);
    return node;
  }

  /**
   * Resolves the method/params path for a transformation
   */
  #resolvePath(
    path: unknown,
    results: unknown[],
  ): { obj?: unknown; path: unknown } {
    // If the path is not a string, return it as is
    if (!_.isString(path)) {
      return { path };
    }

    // Defines special patterns and their corresponding resolution functions
    const patterns: PathResolutionMap = {
      '^\\$\\.(?<obj>lib|input|output)\\.?(?<path>.*)': ({ obj, path }) => ({
        obj: this[obj as 'lib' | 'input' | 'output'],
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
      if (match?.groups)
        return resolve(match.groups as unknown as PathResolutionParams);
    }

    // Returns the path as is if it does not match any special patterns
    return { path };
  }
}

// Exports the JsonMap class as the default export of this module
export { JsonMap };
