"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading API documentation...</p>
      </div>
    </div>
  ),
});

export function SwaggerUIClient() {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI url="/api/openapi.json" />
      <style jsx global>{`
        .swagger-ui-wrapper .swagger-ui {
          font-family: inherit;
        }
        .swagger-ui-wrapper .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui-wrapper .swagger-ui .info {
          margin: 30px 0;
        }
        .swagger-ui-wrapper .swagger-ui .info .title {
          font-size: 2rem;
          font-weight: 700;
        }
        .swagger-ui-wrapper .swagger-ui .opblock-tag {
          font-size: 1.25rem;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
        }
        .swagger-ui-wrapper .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #22c55e;
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-put .opblock-summary-method,
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #f59e0b;
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }
        .swagger-ui-wrapper .swagger-ui .btn.authorize {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        .swagger-ui-wrapper .swagger-ui .btn.execute {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        .swagger-ui-wrapper .swagger-ui select {
          border-radius: 6px;
        }
        .swagger-ui-wrapper .swagger-ui input[type=text],
        .swagger-ui-wrapper .swagger-ui textarea {
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
