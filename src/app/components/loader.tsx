"use client";

import React from 'react';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500" />
        <div className="text-white font-medium">Processing races… this may take a few seconds</div>
      </div>
    </div>
  );
}
