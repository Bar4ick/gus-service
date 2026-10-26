'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type User = { id: string; email: string } | null;
type Profile = { username: string; email: string } | null;
type Order = { id: string; package_name: string; total: number; status: string; created_at: string };
const packages = [
  { id: 'light', name: 'Гусь лайт', price: 990, tag: 'На каждый день', desc: 'Компактный гусиный сервис без лишнего пафоса.' },
  { id: 'boiled', name: 'Сварю гуся', price: 1500, tag: 'Классика', desc: 'Спокойный, основательный тариф.' },
  { id: 'roasted', name: 'Пожарю гуся', price: 2500, tag: 'Популярный', desc: 'Золотистый подход к большим задачам.' },
  { id: 'deluxe', name: 'Гусь Делюкс', price: 4900, tag: 'Премиум', desc: 'Когда обычного гуся уже недостаточно.' },
  { id: 'banquet', name: 'Гусиный банкет', price: 7500, tag: 'Для компании', desc: 'Масштаб, размах и уважение стаи.' },
  { id: 'emperor', name: 'Гусь Император', price: 9999, tag: 'Максимум', desc: 'Тариф с императорскими амбициями.' }
];
const addonList = [{ id: 'sauce', label: 'Особый соус', price: 300 }, { id: 'delivery', label: 'Доставка', price: 700 }, { id: 'gift', label: 'Подарочная упаковка', price: 250 }, { id: 'urgent', label: 'Срочное исполнение', price: 1000 }];
const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';

export default function Storefront({ user, profile, orders }: { user: User; profile: Profile; orders: Order[] }) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('roasted');
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [preference, setPreference] = useState('surprise');
  const [comment, setComment] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderBusy, setOrderBusy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault(); setAuthBusy(true); setAuthMessage(''); setAuthError('');
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = authMode === 'signup' ? { email, username, password } : { identifier, password };
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка авторизации.');
      setAuthMessage(data.message || 'Вход выполнен.'); setPassword('');
      if (authMode === 'login' || !data.needsEmailConfirmation) router.refresh();
    } catch (err) { setAuthError(err instanceof Error ? err.message : 'Не удалось выполнить запрос.'); }
    finally { setAuthBusy(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  const selected = packages.find(p => p.id === selectedPackage) ?? { id: 'certificate', name: 'Подарочный сертификат 10 000 ₸', price: 10000, tag: 'Сертификат', desc: 'Подарок с гусиным размахом.' };
  const addonTotal = addonList.filter(a => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const subtotal = selected.price * quantity + addonTotal;
  const discount = promoCode.trim().toUpperCase() === 'GUS10' ? Math.floor(subtotal * .1) : promoCode.trim().toUpperCase() === 'GUS500' ? Math.min(500, subtotal) : 0;
  const total = subtotal - discount;

  async function placeOrder() {
    setOrderBusy(true); setOrderError(''); setOrderMessage('');
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: selectedPackage, quantity, addons, promoCode, deliveryDate, preference, comment }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось оформить заказ.');
      setOrderMessage(`Заказ №${data.order.id.slice(0, 8)} сохранён. Сумма: ${money(data.order.total)}. Статус: новый, оплата не проводилась.`);
      setComment(''); router.refresh();
    } catch (err) { setOrderError(err instanceof Error ? err.message : 'Ошибка заказа.'); }
    finally { setOrderBusy(false); }
  }

  return <main className={`site ${theme}`}>
    <header className="topbar wrap">
      <a className="brand" href="#home"><span className="brand-mark">🪿</span><span>ГУСЬ<span className="brand-dot">.</span>СЕРВИС<small>Гусиный размах</small></span></a>
      <nav><a href="#tariffs">Тарифы</a><a href="#certificate">Сертификат</a><a href="#support">Поддержка</a></nav>
      <div className="top-actions"><button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Сменить тему">◐</button>{user ? <button className="button button-small button-ghost" onClick={logout}>Выйти</button> : <a className="button button-small" href="#account">Войти</a>}</div>
    </header>

    <section className="hero wrap" id="home">
      <div className="hero-copy"><div className="eyebrow"><span className="pulse" /> ГУСИНЫЙ СЕРВИС · С 2026</div><h1>Большой гусь.<br /><span>Большие планы.</span></h1><p>Выбирай тариф, добавляй опции и оформляй заказ. Всё по-взрослому, кроме самой идеи.</p><div className="hero-actions"><a className="button" href="#tariffs">Выбрать тариф <span>↗</span></a><a className="text-link" href="#certificate">Подарочный сертификат →</a></div><div className="hero-stats"><div><b>6</b><span>тарифов</span></div><div><b>24/7</b><span>приём заявок</span></div><div><b>100%</b><span>гусиный размах</span></div></div></div>
      <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-goose">🪿</div><div className="floating-card card-top"><span className="mini-icon">✦</span><div><b>Премиальный гусь</b><small>Уровень: императорский</small></div></div><div className="floating-card card-bottom"><span className="green-dot"/><div><b>Приём заявок открыт</b><small>Гусь уже в курсе</small></div></div><div className="hero-stamp">ГУСЬ<br />№ 001</div></div>
    </section>

    <section className="section wrap" id="tariffs"><div className="section-heading"><div><div className="eyebrow">КАТАЛОГ УСЛУГ</div><h2>Выбери своего гуся</h2></div><p>От скромного старта до императорского размаха.</p></div><div className="product-grid">{packages.map((p, i) => <article className={`product-card ${p.id === 'roasted' ? 'featured' : ''}`} key={p.id}><div className="product-top"><span className="product-number">0{i + 1} / GOOSE</span><span className="tag">{p.tag}</span></div><div className={`product-emoji emoji-${i}`}>{['🪿','🍲','🔥','✨','🎉','👑'][i]}</div><h3>{p.name}</h3><p>{p.desc}</p><div className="product-bottom"><div><strong>{money(p.price)}</strong><small>за заказ</small></div><button className="round-button" onClick={() => { setSelectedPackage(p.id); document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' }); }}>↗</button></div></article>)}</div></section>

    <section className="order-section" id="order"><div className="wrap order-layout"><div className="order-intro"><div className="eyebrow">ОФОРМЛЕНИЕ</div><h2>Собираем заказ.<br /><span>Без гусиной бюрократии.</span></h2><p>Выбери тариф и дополнительные опции. Заявка сохранится в твоём аккаунте.</p><div className="order-note"><span>ⓘ</span><p>Сейчас это заявка, а не онлайн-оплата. Деньги сайт сам не списывает. Мы хотя бы в этом цивилизованные.</p></div></div><div className="order-panel"><div className="panel-header"><div><span className="panel-kicker">ТВОЙ ЗАКАЗ</span><h3>Конфигуратор гуся</h3></div><span className="panel-icon">✳</span></div>
      <label className="field-label" htmlFor="package">Тариф</label><select id="package" value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)}>{packages.map(p => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}<option value="certificate">Подарочный сертификат 10 000 ₸</option></select>
      <div className="field-row"><div><label className="field-label" htmlFor="qty">Количество</label><input id="qty" type="number" min="1" max="10" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}/></div><div><label className="field-label" htmlFor="date">Желаемая дата</label><input id="date" type="date" value={deliveryDate} min={new Date().toISOString().slice(0,10)} onChange={e => setDeliveryDate(e.target.value)}/></div></div>
      <label className="field-label">Дополнительные опции</label><div className="addon-grid">{addonList.map(a => <label className="addon" key={a.id}><input type="checkbox" checked={addons.includes(a.id)} onChange={e => setAddons(prev => e.target.checked ? [...prev, a.id] : prev.filter(x => x !== a.id))}/><span className="checkmark">✓</span><span>{a.label}<small>+{money(a.price)}</small></span></label>)}</div>
      <label className="field-label" htmlFor="preference">Предпочтение</label><select id="preference" value={preference} onChange={e => setPreference(e.target.value)}><option value="surprise">Удивите меня</option><option value="boiled">Сварить</option><option value="roasted">Пожарить</option></select>
      <label className="field-label" htmlFor="promo">Промокод</label><input id="promo" placeholder="Например, GUS10" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}/><p className="field-hint">Демо-промокоды: GUS10 и GUS500.</p>
      <label className="field-label" htmlFor="comment">Комментарий к заказу</label><textarea id="comment" rows={3} maxLength={1000} placeholder="Пожелания, детали и прочие гусиные нюансы..." value={comment} onChange={e => setComment(e.target.value)}/>
      <div className="total-box"><div><span>Подытог</span><b>{money(subtotal)}</b></div>{discount > 0 && <div><span>Скидка</span><b className="discount">−{money(discount)}</b></div>}<div className="total-line"><span>Итого</span><strong>{money(total)}</strong></div></div>
      {!user && <p className="auth-required">Чтобы сохранить заказ, сначала войди или зарегистрируйся ниже.</p>}{orderError && <p className="error-message">{orderError}</p>}{orderMessage && <p className="success-message">{orderMessage}</p>}<button className="button button-wide" disabled={orderBusy} onClick={placeOrder}>{orderBusy ? 'Сохраняем…' : user ? 'Оформить заявку' : 'Войти для оформления'} <span>↗</span></button>
    </div></div></section>

    <section className="section wrap certificate-section" id="certificate"><div className="certificate-card"><div className="certificate-pattern">✳　✳　✳　✳　✳</div><div className="certificate-left"><div className="eyebrow">ПОДАРОК С ГУСИНЫМ РАЗМАХОМ</div><h2>Подарочный<br />сертификат</h2><p>Для тех, у кого всё есть. Кроме гуся.</p><div className="cert-code"><span>КОД СЕРТИФИКАТА</span><b>GUS-G50XHM</b></div></div><div className="certificate-right"><div className="cert-goose">🪿</div><span>НОМИНАЛ</span><strong>10 000 <small>₸</small></strong><button className="button button-dark" onClick={() => { setSelectedPackage('certificate'); document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' }); }}>Заказать сертификат ↗</button></div></div></section>

    <section className="section wrap account-section" id="account"><div className="section-heading"><div><div className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</div><h2>{user ? `Привет, ${profile?.username || 'гусь'}!` : 'Твой гусиный аккаунт'}</h2></div><p>Аккаунт хранится в Supabase, а не в памяти браузера.</p></div><div className="account-layout"><div className="auth-card">{user ? <><div className="account-avatar">{(profile?.username || user.email || 'G').slice(0,1).toUpperCase()}</div><h3>@{profile?.username || 'пользователь'}</h3><p className="muted">{user.email}</p><div className="account-status"><span className="green-dot"/> Вы вошли в аккаунт</div><button className="button button-wide" onClick={logout}>Выйти из аккаунта</button></> : <><div className="auth-tabs"><button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); setAuthMessage(''); }}>Вход</button><button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage(''); }}>Регистрация</button></div><h3>{authMode === 'signup' ? 'Создать аккаунт' : 'С возвращением'}</h3><p className="muted">{authMode === 'signup' ? 'Пара данных, и ты в стае.' : 'Введи email или логин и пароль.'}</p><form onSubmit={submitAuth}>{authMode === 'signup' ? <><label className="field-label" htmlFor="signup-email">Email</label><input id="signup-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/><label className="field-label" htmlFor="signup-username">Логин</label><input id="signup-username" autoComplete="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={username} onChange={e => setUsername(e.target.value)} placeholder="goose_master"/><p className="field-hint">3–20 символов: латиница, цифры и подчёркивание.</p></> : <><label className="field-label" htmlFor="login-id">Email или логин</label><input id="login-id" autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="email или goose_master"/></>}<label className="field-label" htmlFor="auth-password">Пароль</label><input id="auth-password" type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов"/>{authError && <p className="error-message">{authError}</p>}{authMessage && <p className="success-message">{authMessage}</p>}<button className="button button-wide" disabled={authBusy}>{authBusy ? 'Подожди…' : authMode === 'signup' ? 'Создать аккаунт' : 'Войти'} <span>↗</span></button></form>{authMode === 'signup' && <p className="field-hint">Если включено подтверждение email, проверь входящие письма перед авторизацией.</p>}</>}</div>
      <div className="orders-card"><div className="orders-head"><div><span className="panel-kicker">ИСТОРИЯ</span><h3>Мои заказы</h3></div><span className="orders-count">{orders.length.toString().padStart(2,'0')}</span></div>{!user ? <div className="empty-state"><span>◌</span><b>Заказы появятся здесь</b><p>Сначала нужно войти. База данных пока не умеет читать мысли.</p></div> : orders.length === 0 ? <div className="empty-state"><span>🪿</span><b>Пока пусто</b><p>Твои заявки появятся здесь после оформления.</p></div> : <div className="orders-list">{orders.map(o => <div className="order-row" key={o.id}><div className="order-row-icon">🪿</div><div className="order-row-main"><b>{o.package_name}</b><small>{new Date(o.created_at).toLocaleString('ru-RU')}</small><small className="order-id">№ {o.id.slice(0,8)}</small></div><div className="order-row-price"><b>{money(o.total)}</b><span className="status-pill">{o.status === 'new' ? 'Новый' : o.status}</span></div></div>)}</div>}</div></div></section>

    <section className="support-section" id="support"><div className="wrap support-banner"><div className="support-symbol">↗</div><div><div className="eyebrow">ГУСЬ НА СВЯЗИ</div><h2>Поддержка скоро прилетит</h2><p>Telegram-бот можно подключить позже. Пока оставляем точку входа готовой, без фальшивого «оператор уже печатает».</p></div><span className="coming-soon">TELEGRAM · СКОРО</span></div></section>

    <footer className="footer wrap"><a className="brand" href="#home"><span className="brand-mark">🪿</span><span>ГУСЬ<span className="brand-dot">.</span>СЕРВИС<small>Гусиный размах</small></span></a><p>© 2026 ГУСЬ.СЕРВИС. Все гуси на своих местах.</p><a href="#home">Наверх ↑</a></footer>
  </main>;
}
