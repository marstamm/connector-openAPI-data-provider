import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { getZeebeProperty, OPENAPI_PROPERTY_NAME } from '../util/dataUtil';

export function setProperty(element, value, injector) {
  const commandStack = injector.get('commandStack');
  const moddle = injector.get('moddle');

  const commands = [];

  const {
    commands: createZeebePropertiesCmds,
    zeebeProperties
  } = ensureZeebeProperties(element, injector);
  commands.push(...createZeebePropertiesCmds);

  // Update existing data
  const existingData = getZeebeProperty(element, OPENAPI_PROPERTY_NAME);

  if (existingData) {
    if (value) {

      // Update value
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: existingData,
          properties: {
            value
          }
        }
      });
    }
    else {

      // Remove empty zeebe property
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: zeebeProperties,
          properties: {
            properties: withoutOutData(zeebeProperties.get('properties'))
          }
        }
      });
    }
  }
  else {

    // Create new output data
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: zeebeProperties,
        properties: {
          properties: [
            ...zeebeProperties.get('properties'),
            createOutData(value, moddle)
          ]
        }
      }
    });
  }

  commandStack.execute('properties-panel.multi-command-executor', commands);
}


/**
 * Ensures that Extension elements and the zeebe:Properties extension element exists.
 * Returns the zeebe:Properties element and a list of commands to create them if they don't exist.
 */
const ensureZeebeProperties = (element, injector) => {
  const commands = [];

  const bo = getBusinessObject(element);

  const bpmnFactory = injector.get('bpmnFactory');

  let extensionElements = bo.get('extensionElements');
  if (!extensionElements) {
    extensionElements = bpmnFactory.create(
      'bpmn:ExtensionElements',
      { values: [] }
    );

    extensionElements.$parent = bo;
    commands.push(
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: bo,
          properties: {
            extensionElements
          }
        }
      }
    );
  }

  let zeebeProperties = extensionElements.get('values').find(v => v.$type === 'zeebe:Properties');

  if (!zeebeProperties) {
    zeebeProperties = bpmnFactory.create('zeebe:Properties', {
      properties: []
    });

    zeebeProperties.$parent = extensionElements;

    commands.push(
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [
              ...extensionElements.get('values'),
              zeebeProperties
            ]
          }
        }
      }
    );
  }

  return {
    zeebeProperties,
    commands
  };
};

function createOutData(data, moddle) {
  return moddle.create('zeebe:Property', {
    name: OPENAPI_PROPERTY_NAME,
    value: data
  });
}

function withoutOutData(zeebeProperties) {
  return zeebeProperties.filter(p => p.get('name') !== OPENAPI_PROPERTY_NAME);
}