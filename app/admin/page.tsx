import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminRootPage() {
  const session = await getSession();

  if (session && session.role === 'HR_ADMIN') {
    redirect('/review');
  }

  redirect('/login');
}
