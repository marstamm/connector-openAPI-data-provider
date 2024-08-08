// import VariableProvider from '@bpmn-io/variable-resolver/lib/VariableProvider';
// import { getOpenAPI } from '../util/jsonDataUtil';


import SwaggerClient from 'swagger-client';

import Fuse from 'fuse.js';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

const clients = new Map();

/**
 * Translates a JSON string into a list of variables. Returns an empty list if the
 * JSON string is not parseable.
 *
 * @param {String} data the JSON string to parse
 * @returns {Array} variables
 */
export function getVariablesFromString(data) {
  try {
    const body = JSON.parse(data);
    return body;
  } catch (e) {

    // Malformed JSON
    return [];
  }
}


/**
 * Transforms example data into the internal format, annotating with type and example
 * value.
 *
 * @param {Object} data
 */
export function toInternalFormat(data = {}) {
  if (typeof data !== 'object' || data === null) {
    return;
  }

  return Object.keys(data).map(key => {
    let value = data[key];

    const newElement = {
      name: key,
      info: JSON.stringify(value, null, 2)
    };

    if (Array.isArray(value)) {
      newElement.isList = true;
      newElement.detail = 'List';
      newElement.type = 'List';

      if (value.length > 0) {
        newElement.entries = toInternalFormat(value[0]);
      }
      return newElement;
    }

    newElement.type = getType(value);
    newElement.detail = getType(value);
    newElement.entries = toInternalFormat(value);

    return newElement;
  });
}

function getType(value) {

  if (value === null) {
    return '';
  }

  const type = typeof value;

  if (type === 'object') {
    return 'Context';
  }

  return capitalize(type);
}


function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function getReturnVariables(element) {

  try {
    const hardCodedOutput = getZeebeProperty(element, 'connector:output');
    if (hardCodedOutput) {
      const variables = getVariablesFromString(hardCodedOutput.value);

      return toInternalFormat({
        response: {
          status: 200,
          body: variables,
          headers: {}
        }
      });
    }

    const apiUrl = getZeebeProperty(element, 'connector:apiUrl');
    const apiPath = getInputParameter(element, 'url');
    const method = getInputParameter(element, 'method');

    const path = translatePath(apiPath);

    if (apiUrl && apiPath && method) {
      const example = await getExampleResponse(apiUrl.value, path, method);
      return toInternalFormat({ response: example });
    }
  } catch (e) {
    console.warn(e);
  }

  return [];
}

function getZeebeProperty(element, name) {
  const zeebeProperties = findExtension(element, 'zeebe:Properties');

  return zeebeProperties.get('properties').find((zeebeProperty) => {
    return zeebeProperty.get('name') === name;
  });
}


async function getExampleResponse(apiUrl, apiPath = '/repos/{owner}/{repo}/issues', method = 'POST') {
  let client = clients.get(apiUrl);

  if (!client) {
    client = await SwaggerClient(apiUrl);
    clients.set(apiUrl, client);
  }

  const resolvedSpec = client.spec;

  console.log(resolvedSpec);

  if (resolvedSpec.servers[0].url) {
    apiPath = removeOverlap(resolvedSpec.servers[0].url, apiPath);
  }

  console.log(apiUrl);

  // Get the path object from the spec
  let pathObj = resolvedSpec.paths[apiPath];

  if (!pathObj) {

    // Try fuzzy search

    const fuse = new Fuse(Object.keys(resolvedSpec.paths), { includeScore: true });

    const searchResult = fuse.search(apiPath, { limit: 1, threshold: 0.2 });

    if (!searchResult[0]) {
      throw new Error(`Path "${apiPath}" not found in the specification`);
    }

    console.warn(`no result for ${apiPath}, using ${searchResult[0].item} instead`);

    pathObj = resolvedSpec.paths[searchResult[0].item];
  }

  // Get the method object from the path
  const methodObj = pathObj[method.toLowerCase()];

  if (!methodObj) {
    throw new Error(`Method "${method}" for path "${apiPath}" not found in the specification.`);
  }

  // Check if there is an example response
  const responses = methodObj.responses;
  for (const [ statusCode, response ] of Object.entries(responses)) {
    let exampleResponse;
    let headers = {};

    if (response.content) {
      for (const [ contentType, content ] of Object.entries(response.content)) {
        if (content.example || (content.examples && Object.keys(content.examples).length > 0)) {

          // Return the first example (or the only example if there's only one)
          exampleResponse = content.example || content.examples[Object.keys(content.examples)[0]];
          exampleResponse = exampleResponse.value ? exampleResponse.value : exampleResponse;
        } else if (content.schema) {

          // Generate an example from the schema
          exampleResponse = generateExample(content.schema);
          console.log('generated example', exampleResponse);
        }
      }
    }

    if (response.headers) {
      for (const [ headerName, headerSpec ] of Object.entries(response.headers)) {
        if (headerSpec.example) {
          headers[headerName] = headerSpec.example;
        }
      }
    }

    console.log('exampleResponse', exampleResponse, responses);

    if (exampleResponse) {
      return { status: parseInt(statusCode, 10), body: exampleResponse, headers: headers };
    }
  }

}


function getInputParameter(element, name) {

  const ioMapping = findExtension(element, 'zeebe:IoMapping');
  console.log(ioMapping);
  return findInputParameter(ioMapping, { name }).source;

}


function translatePath(path) {

  // This regular expression matches all instances of `" + variableName + "` in the string.
  const variableRegex = /"\s*\+\s*([^"]+?)((\s*\+\s*")|($))/g;

  // Replace the matched variables with `{variableName}` placeholders
  const translatedPath = path.replace(variableRegex, function(match, variableName) {
    return `{${variableName.trim()}}`;
  });

  // Remove the initial `baseUrl +` part if it exists
  const plusIndex = translatedPath.indexOf('+');
  const cleanedPath = translatedPath.substring(plusIndex + 1);

  // Remove any quotes around the path
  const quoteRegex = /"/g;
  const finalPath = cleanedPath.replace(quoteRegex, '');

  console.log(finalPath);
  return finalPath.trim();
}


export function findExtension(element, type) {
  const businessObject = getBusinessObject(element);

  let extensionElements;

  if (is(businessObject, 'bpmn:ExtensionElements')) {
    extensionElements = businessObject;
  } else {
    extensionElements = businessObject.get('extensionElements');
  }

  if (!extensionElements) {
    return;
  }

  return extensionElements.get('values').find((value) => {
    return is(value, type);
  });
}
export function findInputParameter(ioMapping, binding) {
  const parameters = ioMapping.get('inputParameters');

  return parameters.find((parameter) => {
    return parameter.target === binding.name;
  });
}


function generateExample(schema) {

  // Base case: if the schema has an 'example', return it directly.
  if ('example' in schema) {
    return schema.example;
  }

  // Handle object types by iterating over properties.
  if (schema.type === 'object' && schema.properties) {
    let obj = {};
    for (const [ key, value ] of Object.entries(schema.properties)) {
      obj[key] = generateExample(value); // Recursively generate examples for nested properties.
    }
    return obj;
  }

  // Handle array types by creating an array with a single example item.
  if (schema.type === 'array' && schema.items) {
    return [ generateExample(schema.items) ]; // Recursively generate an example for the items type.
  }

  // Handle primitive types without examples by providing a default value.
  switch (schema.type) {
  case 'string':
    return 'example_string';
  case 'number':
    return 123;
  case 'integer':
    return 123;
  case 'boolean':
    return true;
  case 'null':
    return null;
  default:
    return undefined; // Undefined type or not handled.
  }
}


function removeOverlap(str1, str2) {

  // Check if either string is empty
  if (!str1.length || !str2.length) {
    return str2;
  }

  // Start by checking the largest possible overlap, which is the smaller string's length
  let maxOverlapLength = Math.min(str1.length, str2.length);

  // Try to find the overlap from the largest possible size to the smallest
  for (let size = maxOverlapLength; size > 0; size--) {

    // Get the end of the first string to compare
    let endOfStr1 = str1.substring(str1.length - size);

    // Get the beginning of the second string to compare
    let startOfStr2 = str2.substring(0, size);

    // If the substrings match, we have an overlap
    if (endOfStr1 === startOfStr2) {

      // Return the non-overlapping part of str2
      return str2.substring(size);
    }
  }

  // If no overlap is found, return the entire str2
  return str2;
}
