declare module "swagger-ui-react" {
  import { ComponentType } from "react";

  /** The outgoing "try it out" request Swagger UI hands to requestInterceptor. */
  interface SwaggerRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    credentials?: RequestCredentials;
  }

  /** The response Swagger UI hands to responseInterceptor before rendering it. */
  interface SwaggerResponse {
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    headers: Record<string, string>;
    text?: string;
  }

  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    layout?: string;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    tryItOutEnabled?: boolean;
    validatorUrl?: string | null;
    onComplete?: () => void;
    requestInterceptor?: (req: SwaggerRequest) => SwaggerRequest;
    responseInterceptor?: (res: SwaggerResponse) => SwaggerResponse;
    persistAuthorization?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
