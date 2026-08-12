import { redirect } from 'next/navigation';

export default function HomePage() {
  // Always redirect root URL (http://localhost:3000) straight to the public Station Validation Form
  redirect('/upload');
}
