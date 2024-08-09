import { TextAreaEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import {
  EXAMPLE_PROPERTY_NAME,
  getExampleReturn
} from '../util/dataUtil';
import { setProperty } from './util';

/**
 * Allows to edit the example JSON data of a task in a TextArea. Stores the data
 * in a zeebe:Property with the name specified in `exampleDataUtil`.
 */
const ExampleDataProperty = (props) => {
  const {
    element
  } = props;

  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const injector = useService('injector');

  const getValue = () => {
    return getExampleReturn(element);
  };

  const setValue = (value) => {
    setProperty(element, value, injector, EXAMPLE_PROPERTY_NAME);
  };


  return TextAreaEntry({
    element,
    label: translate('Example Return Value'),
    id: 'exampleReturnValue',
    getValue,
    setValue,
    debounce,
    monospace: true
  });
};

export default ExampleDataProperty;
