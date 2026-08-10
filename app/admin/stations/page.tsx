import { redirect } from 'next/navigation';

export default function StationsRedirectPage() {
  redirect('/admin/cms?tab=stations');
}
