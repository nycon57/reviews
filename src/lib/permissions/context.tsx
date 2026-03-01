"use client";

import * as React from "react";
import {
  type UserContext,
  type Permission,
  hasPermission,
  canAccessProFeature,
  shouldShowUpgradeCTA,
  canInviteTeam,
  canImpersonateUsers,
  getUserTierLabel,
} from "./index";

interface PermissionContextValue {
  userContext: UserContext | null;
  hasPermission: (permission: Permission) => boolean;
  canAccessProFeature: () => boolean;
  shouldShowUpgradeCTA: () => boolean;
  canInviteTeam: () => boolean;
  canImpersonateUsers: () => boolean;
  getUserTierLabel: () => string;
  isLoading: boolean;
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  children: React.ReactNode;
  userContext: UserContext | null;
  isLoading?: boolean;
}

export function PermissionProvider({
  children,
  userContext,
  isLoading = false,
}: PermissionProviderProps) {
  const value = React.useMemo<PermissionContextValue>(
    () => ({
      userContext,
      hasPermission: (permission: Permission) => hasPermission(userContext, permission),
      canAccessProFeature: () => canAccessProFeature(userContext),
      shouldShowUpgradeCTA: () => shouldShowUpgradeCTA(userContext),
      canInviteTeam: () => canInviteTeam(userContext),
      canImpersonateUsers: () => canImpersonateUsers(userContext),
      getUserTierLabel: () => getUserTierLabel(userContext),
      isLoading,
    }),
    [userContext, isLoading]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  const context = React.useContext(PermissionContext);

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }

  return context;
}

/**
 * Hook to check a single permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { hasPermission, isLoading } = usePermissions();

  // Default to false while loading
  if (isLoading) return false;

  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (any)
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return false;

  return permissions.some(hasPermission);
}

/**
 * Component that conditionally renders based on permission
 */
interface RequirePermissionProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const allowed = useHasPermission(permission);
  return <>{allowed ? children : fallback}</>;
}

/**
 * Component that shows upgrade prompt for Pro features
 */
interface ProFeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProFeatureGate({ children, fallback }: ProFeatureGateProps) {
  const { canAccessProFeature, isLoading } = usePermissions();

  if (isLoading) return null;

  if (canAccessProFeature()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
