// components/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SplashScreenProps {
  onFinish: () => void; // Callback ketika splash screen selesai
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Atur timer untuk menyembunyikan splash screen
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish(); // Panggil callback
    }, 3000); // Tampilkan selama 3 detik (sesuaikan)

    // Cleanup timer
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return null; // Tidak render jika sudah tidak terlihat
  }

  return (
    <div className="fixed inset-0 bg-indigo-700 flex flex-col items-center justify-center z-50 transition-opacity duration-1000">
      {/* Container untuk logo dan potensi loading indicator */}
      <div className="flex flex-col items-center space-y-4">
        <Image
          src="/applogo-splash.png" // Pastikan gambar logo ini tersedia di public folder
          alt="Sister; VL ab²³ Logo"
          width={300} // Sesuaikan ukuran logo splash screen
          height={100} // Sesuaikan ukuran logo splash screen
          priority
        />
        {/* Opsional: Loading indicator */}
        <div className="w-16 h-16 border-4 border-t-4 border-indigo-200 border-t-white rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-white text-lg">Loading...</p>
    </div>
  );
}