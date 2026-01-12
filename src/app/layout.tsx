import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WCAG Simple - Accessibility Scanner',
  description: 'Simple web crawler for WCAG 2.1 AA accessibility violations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
