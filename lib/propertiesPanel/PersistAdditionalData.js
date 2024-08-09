import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getZeebeProperty, OPENAPI_PROPERTY_NAME } from '../util/dataUtil';
import { setProperty } from './util';

export class PersistAdditionalDataBehavior extends CommandInterceptor {
  constructor(eventBus, injector) {
    super(eventBus);

    this.preExecute([
      'propertiesPanel.zeebe.changeTemplate'
    ], (event) => {
      const { context } = event;

      const existingData = getZeebeProperty(context.element, OPENAPI_PROPERTY_NAME);
      if (existingData) {
        context['___existingOpenAPIData'] = existingData;
      }
    });


    this.postExecuted([
      'propertiesPanel.zeebe.changeTemplate'
    ], (event, ...rest) => {
      const { context } = event;

      if (context['___existingOpenAPIData']) {
        setProperty(context.element, context['___existingOpenAPIData'].value, injector);
      }
    });

  }
}

PersistAdditionalDataBehavior.$inject = [
  'eventBus',
  'injector'
];
