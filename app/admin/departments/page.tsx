import { redirect } from 'next/navigation';

export default function DepartmentsRedirectPage() {
  redirect('/admin/cms?tab=departments');
}
