"use client";

import { useEffect, useMemo, useState } from "react";
import { validateGraph } from "../lib/validator";
import type {
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
} from "../lib/workflow-types";

const INITIAL_RESULT: ValidationResult = {
  errors: [],
  warnings: [],
  isValid: false,
};

export function useValidation(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const [result, setResult] = useState<ValidationResult>(INITIAL_RESULT);

  const serializedInput = useMemo(
    () => JSON.stringify({ nodes, edges }),
    [nodes, edges]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setResult(validateGraph(nodes, edges));
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedInput]);

  return result;
}
