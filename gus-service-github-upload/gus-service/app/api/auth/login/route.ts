import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');
    if (!identifier || !password) return NextResponse.json({ error: 'Заполни логин/email и пароль.' }, { status: 400 });

    let email = identifier.toLowerCase();
    if (!identifier.includes('@')) {
      // Username-to-email lookup happens only on the server using the service-role key.
      // The email is never returned to the browser.
      const admin = createSupabaseAdminClient();
      const { data: profile, error: lookupError } = await admin.from('profiles')
        .select('email').eq('username', identifier.toLowerCase()).maybeSingle();
      if (lookupError || !profile?.email) return NextResponse.json({ error: 'Неверный логин или пароль.' }, { status: 401 });
      email = profile.email;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: 'Неверный логин/email или пароль. Если регистрация новая, сначала подтверди email.' }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка входа. Проверь переменные окружения и настройки Supabase.' }, { status: 500 });
  }
}
