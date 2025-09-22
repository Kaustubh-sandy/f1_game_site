"use client";

import Home from './components/home';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="min-h-screen w-full relative font-sans">
      {/* Background image with dark overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/F6e6EaIWMAEhbam.jpg"
          alt="F1 Background"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/20 to-red-900/40" />
      </div>
      <div className="relative z-20">
        <Home />
      </div>
    </div>
  );
}