'use client';

import React, { Suspense } from 'react';
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080C16] text-slate-100 flex flex-col justify-between relative selection:bg-cyan-500 selection:text-black">
      {/* Brilho radial ciano no topo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-gradient-to-b from-cyan-500/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-0" />

      <main className="w-full max-w-md mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center relative z-10">
        <Suspense fallback={
          <div className="text-center text-xs font-mono text-cyan-400 py-12">
            Carregando Terminal JHPCS...
          </div>
        }>
          <UnifiedLoginForm />
        </Suspense>
      </main>
    </div>
  );
}
