import { redirect } from 'next/navigation';

// API keys are org-scoped and live in the Workspace (ADR 0007).
export default function ApiKeysPage() {
  redirect('/dashboard/organization?tab=api');
}
