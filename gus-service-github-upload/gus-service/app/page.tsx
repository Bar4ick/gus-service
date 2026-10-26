import Storefront from './components/Storefront';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { username: string; email: string } | null = null;
  let orders: Array<{ id: string; package_name: string; total: number; status: string; created_at: string }> = [];

  if (user) {
    const { data } = await supabase.from('profiles').select('username,email').eq('id', user.id).maybeSingle();
    profile = data;
    const { data: orderData } = await supabase.from('orders').select('id,package_name,total,status,created_at').order('created_at', { ascending: false }).limit(10);
    orders = orderData ?? [];
  }

  return <Storefront user={user ? { id: user.id, email: user.email ?? '' } : null} profile={profile} orders={orders} />;
}
