import { redirect } from 'next/navigation';

// Redirect to the main settings page with the API tab selected
export default function ApiKeysPage() {
  redirect('/dashboard/settings?tab=api');
}
