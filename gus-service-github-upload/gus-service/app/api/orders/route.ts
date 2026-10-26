import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const PACKAGES: Record<string, { name: string; price: number }> = {
  light: { name: 'Гусь лайт', price: 990 },
  boiled: { name: 'Сварю гуся', price: 1500 },
  roasted: { name: 'Пожарю гуся', price: 2500 },
  deluxe: { name: 'Гусь Делюкс', price: 4900 },
  banquet: { name: 'Гусиный банкет', price: 7500 },
  emperor: { name: 'Гусь Император', price: 9999 },
  certificate: { name: 'Подарочный сертификат 10 000 ₸', price: 10000 }
};
const ADDONS: Record<string, number> = { sauce: 300, delivery: 700, gift: 250, urgent: 1000 };

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Войди в аккаунт, чтобы оформить заказ.' }, { status: 401 });
    const body = await request.json();
    const item = PACKAGES[String(body.packageId ?? '')];
    const quantity = Math.max(1, Math.min(10, Number.parseInt(String(body.quantity ?? '1'), 10) || 1));
    if (!item) return NextResponse.json({ error: 'Неизвестный тариф.' }, { status: 400 });
    const addonIds: string[] = Array.isArray(body.addons) ? body.addons.filter((x: unknown) => typeof x === 'string' && x in ADDONS) : [];
    const addonsTotal = [...new Set(addonIds)].reduce((sum, id) => sum + ADDONS[id], 0);
    const code = String(body.promoCode ?? '').trim().toUpperCase();
    const subtotal = item.price * quantity + addonsTotal;
    const discount = code === 'GUS10' ? Math.floor(subtotal * 0.1) : code === 'GUS500' ? Math.min(500, subtotal) : 0;
    const total = Math.max(0, subtotal - discount);
    const deliveryDate = body.deliveryDate ? String(body.deliveryDate) : null;
    const preference = ['boiled', 'roasted', 'surprise'].includes(String(body.preference)) ? String(body.preference) : 'surprise';
    const comment = String(body.comment ?? '').trim().slice(0, 1000);

    const { data, error } = await supabase.from('orders').insert({
      user_id: user.id, package_id: String(body.packageId), package_name: item.name,
      unit_price: item.price, quantity, addons: [...new Set(addonIds)], promo_code: discount ? code : null,
      discount, total, delivery_date: deliveryDate, preference, comment, status: 'new'
    }).select('id,package_name,total,status,created_at').single();
    if (error) return NextResponse.json({ error: 'Заказ не сохранён. Проверь SQL-схему Supabase.' }, { status: 500 });
    return NextResponse.json({ ok: true, order: data });
  } catch {
    return NextResponse.json({ error: 'Не удалось оформить заказ.' }, { status: 500 });
  }
}
