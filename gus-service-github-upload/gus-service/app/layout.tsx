import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'ГУСЬ.СЕРВИС | Гусиный размах',
  description: 'Заказы, тарифы и подарочные сертификаты ГУСЬ.СЕРВИС.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
