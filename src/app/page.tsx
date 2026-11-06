'use client';

import React, { useEffect, useState } from 'react';
import { MaintainerPwaWizard } from '@/components/MaintainerPwaWizard';
import { Droplet, Smartphone, ShieldCheck, Download, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function CampoHomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando como PWA instalado (Standalone no Android/iOS)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Registra Service Worker se suportado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration error:', err));
    }

    // Captura o evento nativo de instalação do Chrome / Edge Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Como instalar o App do Piscineiro no seu celular:\n\n' +
        '• No Android (Chrome): Toque no menu de 3 pontinhos (⋮) no topo direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".\n\n' +
        '• No iPhone (Safari): Toque no botão de Compartilhar (ícone com quadrado e seta para cima) e escolha "Adicionar à Tela de Início".\n\n' +
        'O ícone do JHPCS Tratador será criado e funcionará como um aplicativo nativo e offline!'
      );
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full p-4 relative">
      {/* Top Banner de Status / Instalação PWA */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              JHPCS CAMPO
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.5 rounded font-mono">
                PWA
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Terminal de Coleta & Vistoria</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStandalone && !installed && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg transition-all animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          <Link
            href="/ajuda"
            className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 px-2.5 py-1.5 rounded-lg transition-all"
            title="Ajuda e Manual do Tratador"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ajuda</span>
          </Link>
        </div>
      </div>

      {/* Wizard Principal do Tratador */}
      <div className="flex-1">
        <MaintainerPwaWizard />
      </div>

      {/* Footer com status offline e link de primeiro acesso */}
      <footer className="mt-8 pt-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/ajuda"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-[11px] font-medium"
          >
            Manual & Dúvidas
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/primeiro-acesso"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-[11px]"
          >
            Ativação de PIN
          </Link>
          <span className="text-slate-700">•</span>
          <span className="text-[11px] text-slate-500">v1.0 Offline First</span>
        </div>
        <p className="text-[10px] text-slate-600">
          JHoston Pools Control System • Modo Campo
        </p>
      </footer>
    </main>
  );
}

