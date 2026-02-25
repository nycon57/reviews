"use client";

import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WorkflowBuilderErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage: string;
}

interface WorkflowBuilderErrorBoundaryState {
  hasError: boolean;
}

export class WorkflowBuilderErrorBoundary extends React.Component<
  WorkflowBuilderErrorBoundaryProps,
  WorkflowBuilderErrorBoundaryState
> {
  constructor(props: WorkflowBuilderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WorkflowBuilderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[WorkflowBuilderErrorBoundary]", error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-4">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <WarningCircle className="h-8 w-8 text-destructive" />
            <p className="max-w-sm text-sm text-muted-foreground">{this.props.fallbackMessage}</p>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
