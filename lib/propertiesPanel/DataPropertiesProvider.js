import {
  Group,
  isTextFieldEntryEdited
} from '@bpmn-io/properties-panel';

import JSONDataProperty from './JSONDataProperty';
import { findExtension } from '../variableProvider/utils';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

const VERY_LOW_PRIORITY = 100;

export default class DataPropertiesProvider {
  constructor(propertiesPanel, injector) {
    this._injector = injector;
    propertiesPanel.registerProvider(VERY_LOW_PRIORITY, this);
  }

  getGroups(element) {
    const translate = this._injector.get('translate');
    const elementTemplates = this._injector.get('elementTemplates', false);
    let template = null;

    if (elementTemplates) {
      template = elementTemplates.get(element);
    }

    console.log(template, element);
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
        label: translate('OpenAPI Data'),
        entries: [
          {
            id: 'openAPI',
            component: JSONDataProperty,
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
