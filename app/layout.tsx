import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen app-bg text-white">
        <Navbar />
        <main className="flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-6xl glass-card rounded-2xl shadow-glass p-6 md:p-12 animate-fade-in-up">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
