'use client';

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the discover page as the new home page
  redirect('/discover');
}
