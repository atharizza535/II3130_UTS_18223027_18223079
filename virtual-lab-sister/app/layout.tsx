// app/layout.tsx
'use client'; // Pastikan ini ada jika menggunakan hooks seperti useState

import { Inter } from 'next/font/google';
import './globals.css';
import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen'; // Pastikan path benar

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  // Jika Anda ingin splash screen hanya muncul sekali saat aplikasi dimuat
  useEffect(() => {
    // Anda bisa menyimpan di localStorage agar tidak muncul setiap kali user refresh
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    localStorage.setItem('hasSeenSplash', 'true'); // Tandai bahwa splash sudah dilihat
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        {showSplash ? (
          <SplashScreen onFinish={handleSplashFinish} />
        ) : (
          children // Render konten aplikasi setelah splash screen selesai
        )}
      </body>
    </html>
  );
  
}