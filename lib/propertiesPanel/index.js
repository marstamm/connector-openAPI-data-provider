import DataPropertiesProvider from './DataPropertiesProvider';
import { PersistAdditionalDataBehavior } from './PersistAdditionalData';

export default {
  __init__: [ 'dataPropertiesProvider', 'persistAdditionalDataBehavior' ],
  dataPropertiesProvider: [ 'type', DataPropertiesProvider ],
  persistAdditionalDataBehavior: [ 'type', PersistAdditionalDataBehavior ]
};