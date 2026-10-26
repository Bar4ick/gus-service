import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Укажи корректный email.' }, { status: 400 });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return NextResponse.json({ error: 'Логин: 3–20 символов, только латиница, цифры и _.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов.' }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    });
    if (error) {
      const message = /duplicate|unique|already registered/i.test(error.message)
        ? 'Этот email или логин уже занят.' : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, needsEmailConfirmation: !data.session, message: data.session ? 'Аккаунт создан.' : 'Проверь почту и подтверди email, затем войди.' });
  } catch {
    return NextResponse.json({ error: 'Не удалось создать аккаунт. Проверь настройки Supabase.' }, { status: 500 });
  }
}
