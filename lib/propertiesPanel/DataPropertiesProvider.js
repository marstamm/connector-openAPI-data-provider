import {
  Group,
  isTextFieldEntryEdited
} from '@bpmn-io/properties-panel';

import OpenAPIURLProperty from './OpenAPIDataProperty';
import { findExtension } from '../variableProvider/utils';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import ExampleDataProperty from './ExampleOutputProperty';

const VERY_LOW_PRIORITY = 100;

export default class DataPropertiesProvider {
  constructor(propertiesPanel, injector) {
    this._injector = injector;
    propertiesPanel.registerProvider(VERY_LOW_PRIORITY, this);
  }

  getGroups(element) {
    const translate = this._injector.get('translate');

    const bo = getBusinessObject(element);
    const taskDefinition = findExtension(bo, 'zeebe:TaskDefinition');

    const type = taskDefinition && taskDefinition.get('type');

    const shouldShow = (type && type.startsWith('io.camunda:http-json'));

    return (groups) => {

      if (!shouldShow) {
        return groups;
      }

      const group = {
        id: 'additionalDataGroup',
        label: translate('Data Sources'),
        entries: [
          {
            id: 'returnValue',
            component: ExampleDataProperty,
            isEdited: isTextFieldEntryEdited
          },
          {
            id: 'openAPI',
            component: OpenAPIURLProperty,
            isEdited: isTextFieldEntryEdited
          }
        ],
        component: Group
      };

      groups.push(group);
      return groups;
    };
  }
}

DataPropertiesProvider.$inject = [ 'propertiesPanel', 'injector' ];
