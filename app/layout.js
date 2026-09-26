import './globals.css';

export const metadata = {
  title: 'Planner de Demandas',
  description: 'Demandas diárias, urgentes e mensais',
  appleWebApp: { capable: true, title: 'Planner', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
