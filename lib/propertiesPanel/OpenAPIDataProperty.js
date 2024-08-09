import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import {
  getOpenAPI
} from '../util/dataUtil';
import { setProperty } from './util';

/**
 * Allows to edit the example JSON data of a task in a TextArea. Stores the data
 * in a zeebe:Property with the name specified in `exampleDataUtil`.
 */
const OpenAPIDataProperty = (props) => {
  const {
    element
  } = props;

  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const injector = useService('injector');

  const getValue = () => {
    return getOpenAPI(element);
  };

  const setValue = (value) => {
    setProperty(element, value, injector);
  };


  return TextFieldEntry({
    element,
    label: translate('OpenAPI URL'),
    id: 'openAPI',
    getValue,
    setValue,
    debounce,
    monospace: true
  });
};

export default OpenAPIDataProperty;
