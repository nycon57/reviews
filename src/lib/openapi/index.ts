/**
 * OpenAPI Module
 * Public exports for OpenAPI spec generation
 */

export { registry, generateOpenApiSpec, webhookEventTypes } from './registry';

export {
  generateCurlSample,
  generateJavaScriptSample,
  generatePythonSample,
  generateCodeSamples,
  exampleRequestBodies,
  exampleQueryParams,
} from './code-samples';

export type { CodeLanguage, CodeSampleParams } from './code-samples';
