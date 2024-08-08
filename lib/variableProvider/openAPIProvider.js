import VariableProvider from '@bpmn-io/variable-resolver/lib//VariableProvider';
import { getExtensionElementsList } from '@bpmn-io/variable-resolver/lib/base/util/ExtensionElementsUtil';
import { getResultContext, toUnifiedFormat } from '@bpmn-io/variable-resolver/lib/zeebe/util/feelUtility';
import { getReturnVariables } from './utils';


/**
 * TODO: This method tries to mirror the behavior of ConnectorMappings. However, this is not possible in all cases,
 * as the absence of the header has execution implications. This should be replaced with engine behavior in the
 * Connector Implementation at one point.
 */
class ConnectorVariableProvider extends VariableProvider {
  async getVariables(element) {

    const result = [];

    const taskheaders = getExtensionElementsList(element, 'zeebe:TaskHeaders')[0];

    if (!taskheaders || !taskheaders.values) {
      return;
    }

    const headers = taskheaders.values;

    const resultVariable = headers.find(header => {
      return header.key === 'resultVariable';
    });

    const resultExpression = headers.find(header => {
      return header.key === 'resultExpression';
    });

    if (resultVariable && resultVariable.value) {
      result.push({
        name: resultVariable.value
      });
    }

    if (resultExpression && resultExpression.value) {

      // parse with FEEL
      const variables = await getReturnVariables(element);

      const rootContext = {
        name: 'OuterContext',
        entries: toOptimizedFormat(variables)
      };

      const resultContext = getResultContext(resultExpression.value.substring(1), rootContext);
      const expressionVariables = toUnifiedFormat(resultContext.computedValue(), result);

      if (expressionVariables && expressionVariables.length > 0) {
        result.push(
          ...expressionVariables[0].entries
        );
      }
    }

    return result;
  }
}

export default ConnectorVariableProvider;


/**
 * Transforms the entries of a variable from an array to an object.
 * This allows faster lookup times during parsing.
 *
 * [ { name, entries: [] } ]
 * to
 * {name: { name, entries: {} }}
 */
function toOptimizedFormat(variables) {

  if (!variables) {
    return;
  }

  const result = {};

  variables.forEach(variable => {
    result[variable.name] = { ...variable };
    result[variable.name].entries = toOptimizedFormat(variable.entries);
  });

  return result;
}