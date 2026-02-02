import type { CSSProperties, ReactNode } from "react";

interface WidgetShellProps {
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  loading: boolean;
  error: string | null;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Shared wrapper that handles loading, error, and container rendering
 * for all widget components.
 */
export function WidgetShell({
  className,
  style,
  ariaLabel,
  loading,
  error,
  fallback,
  children,
}: WidgetShellProps) {
  const baseClass = "rw-react-widget";
  const classes = [baseClass, className].filter(Boolean).join(" ");

  if (loading) {
    return (
      <div className={classes} style={style} role="status" aria-label="Loading widget">
        {fallback ?? (
          <div className="rw-react-widget__loading">
            <div className="rw-react-widget__skeleton" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes} style={style} role="alert">
        <div className="rw-react-widget__error">{error}</div>
      </div>
    );
  }

  return (
    <div className={classes} style={style} role="region" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
