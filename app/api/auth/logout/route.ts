import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('kmart_guest', '', { path: '/', maxAge: 0 });
  return response;
}
