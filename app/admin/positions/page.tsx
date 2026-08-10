import { redirect } from 'next/navigation';

export default function PositionsRedirectPage() {
  redirect('/admin/cms?tab=positions');
}
