import _ from 'lodash';

/**
 * JsonMap class to apply transformations to a JSON object
 */
class JsonMap {
  /**
   * Creates an instance of JsonMap.
   *
   * @param {object} lib - A collection of function libraries.
   * @param {object} map - The data mapping configuration.
   */
  constructor(lib, map) {
    this.lib = lib;
    this.map = map;
  }

  /**
   * Transforms the input data according to the map configuration.
   *
   * @param {object} input - The input data to be transformed.
   * @returns {object} - The transformed data.
   */
  async transform(input) {
    // Sets the input data and initializes an empty output object
    this.input = input;
    this.output = {};

    // Calls the #transform method to perform the transformation
    return await this.#transform(this.map, this.input, this.output);
  }

  /**
   * Recursive function to handle transformations.
   *
   * @param {object} node - The current map node.
   * @param {object} input - The current input node.
   * @param {object} output - The current output node.
   * @param {string} path - The path to the current node.
   * @returns {object} - The transformed node.
   * @private
   */
  async #transform(node, input, output, path = '') {
    // Checks if the current node is an object and has a '$' key
    if (_.isObject(node) && '$' in node) {
      // Retrieves the transformations to be applied (can be an array or a single object)
      const transformations = _.isArray(node['$']) ? node['$'] : [node['$']];

      // Array to store the results of the transformations
      let results = [];

      // Iterates over each transformation
      for (const transformation of transformations) {
        // Resolves the object path for the transformation
        const object = this.#resolvePath(transformation.object, results);

        // Resolves the parameter paths for the transformation
        const params = await Promise.all(
          _.castArray(transformation.params).map((param) =>
            this.#resolvePath(param, results)
          )
        );

        // Calls the specified method on the resolved object with the resolved parameters
        const result = await object[transformation.method](...params);

        // Stores the result of the transformation
        results.push(result);
      }

      // Sets the output at the specified path to the last result of the transformations & returns.
      const last = _.last(results);
      _.set(output, path, last);
      return last;
    }

    // Checks if the current node is an object
    if (_.isObject(node)) {
      // Creates an empty array or object based on whether the current node is an array or not
      const transformedNode = _.isArray(node) ? [] : {};

      // Iterates over each key-value pair in the current node
      for (const [key, value] of Object.entries(node)) {
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
      _.set(output, path, transformedNode);
      return transformedNode;
    }

    // Sets the output at the specified path to the current node & returns.
    _.set(output, path, node);
    return node;
  }

  /**
   * Resolves the object/method/params path for a transformation
   *
   * @param {string} path - The path to be resolved.
   * @param {Array} results - The results from previous transformations.
   * @return {string} - The resolved path.
   * @private
   */
  #resolvePath(path, results) {
    // If the path is not a string, return it as is
    if (!_.isString(path)) {
      return path;
    }

    // Defines special patterns and their corresponding values for resolution
    const specialPatterns = {
      '$.lib': this.lib,
      '$.input': this.input,
      '$.output': this.output,
    };

    // Checks if the path matches the pattern for accessing previous results
    const match = path.match(/^\$\[(\d+)\](.*)$/);

    // Retrieves the value from the previous results based on the index and any remaining path
    if (match) {
      const [, index, rest] = match;
      const value = _.get(results, [
        results.length - 1 - _.parseInt(index),
        ...(rest.length ? rest.split('.') : []),
      ]);

      // Returns the value if it exists, otherwise returns the original path
      return value != null ? value : path;
    }

    // Iterates over the special patterns
    for (const [pattern, replacement] of Object.entries(specialPatterns))
      if (path.startsWith(pattern)) {
        // Removes the pattern from the beginning of the path
        const p = path.slice(pattern.length + 1);

        // Retrieves the value from the replacement object based on the remaining path
        const value = p.length ? _.get(replacement, p) : replacement;

        // Returns the value if it exists, otherwise returns the original path
        return _.isNil(value) ? path : value;
      }

    // Returns the path as is if it does not match any special patterns
    return path;
  }
}

// Exports the JsonMap class as the default export of this module
export { JsonMap };
