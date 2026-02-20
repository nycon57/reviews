"use client";

import React from "react";
import { WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AnalyticsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AnalyticsErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const message =
        this.props.fallbackMessage ??
        "This section failed to load. You can try again or continue using the rest of the dashboard.";

      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;
