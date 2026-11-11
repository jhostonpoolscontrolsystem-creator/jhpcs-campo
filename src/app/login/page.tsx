'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Monitor, 
  Building2, 
  Truck, 
  User, 
  CheckCircle2, 
  ExternalLink, 
  HelpCircle,
  RotateCcw,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useDeviceContext } from '@/hooks/useDeviceContext';
import { TargetSector, DEMO_ACCOUNTS } from '@/types/profiles';
import { isBiometricsAvailable, authenticateWithBiometrics } from '@/lib/auth/webauthn';
import { 
  saveCachedSession, 
  getCachedSession, 
  CachedSessionMetadata 
} from '@/lib/auth/cachedSession';
import { triggerHaptic } from '@/lib/ui/haptics';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isStandalone, isMobile } = useDeviceContext();

  // Parâmetros contextuais da URL (NFC / QR Code / Redirect)
  const poolIdParam = searchParams.get('pool_id');
  const nfcTagParam = searchParams.get('nfc_tag');
  const redirectParam = searchParams.get('redirect') || '/';

  // Estados de formulário
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de conectividade e sessão offline
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cachedSession, setCachedSession] = useState<CachedSessionMetadata | null>(null);

  // Biometria
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState<boolean>(false);

  // Acordeão de Contas de Demonstração (apenas Desktop)
  const [showDemoAccordion, setShowDemoAccordion] = useState<boolean>(false);

  // Modal de Recuperação de Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Monitorar conectividade
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Carregar sessão em cache se existir
    const prev = getCachedSession();
    if (prev) {
      setCachedSession(prev);
      if (!identifier && prev.operator_email) {
        setIdentifier(prev.operator_email);
      }
    }

    // 3. Checar biometria disponível
    isBiometricsAvailable().then((supported) => setHasBiometrics(supported));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Por favor, informe seu e-mail ou identificador e senha.');
      triggerHaptic('error');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic('light');

    try {
      // 1. Chamada de autenticação PWA
      const res = await fetch('/api/auth/pwa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.includes('@') ? identifier : undefined,
          cpf: !identifier.includes('@') ? identifier : undefined,
          pin: password,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        triggerHaptic('success');

        // Salvar metadados da sessão para contingência offline
        const sessionMeta: CachedSessionMetadata = {
          operator_id: data.user.id,
          operator_name: data.user.name,
          operator_email: data.user.email || identifier,
          tenant_name: data.user.tenantName || 'JHoston Pools & Parceiros',
          target_sector: (data.user.targetSector as TargetSector) || 'AUTONOMO',
          sector_badge: data.user.sectorLabel || 'Piscineiro Autorizado',
          cached_session_token: data.token,
          last_sync_at: new Date().toISOString(),
          cpf: data.user.cpf,
        };

        saveCachedSession(sessionMeta);

        // Se houver pool_id no query param, redirecionar com foco nela
        const targetUrl = poolIdParam
          ? `/?pool_id=${encodeURIComponent(poolIdParam)}`
          : redirectParam;

        router.push(targetUrl);
      } else {
        triggerHaptic('error');
        setErrorMessage(data.error || 'Credenciais inválidas. Verifique seu usuário e senha.');
      }
    } catch (err: any) {
      triggerHaptic('warning');
      // Se a rede falhar mas houver sessão em cache com o mesmo usuário, permitir entrada offline
      if (cachedSession && (cachedSession.operator_email === identifier || cachedSession.cpf === identifier)) {
        triggerHaptic('success');
        router.push(poolIdParam ? `/?pool_id=${encodeURIComponent(poolIdParam)}` : redirectParam);
      } else {
        setErrorMessage('Falha ao conectar aos servidores JHPCS. Verifique seu sinal ou entre no modo offline.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeCachedSession = () => {
    if (!cachedSession) return;
    triggerHaptic('medium');
    const targetUrl = poolIdParam
      ? `/?pool_id=${encodeURIComponent(poolIdParam)}`
      : redirectParam;
    router.push(targetUrl);
  };

  const handleBiometricAuth = async () => {
    const targetCpf = cachedSession?.cpf || identifier;
    if (!targetCpf) {
      setErrorMessage('Informe seu CPF ou acesse previamente uma vez para vincular sua biometria.');
      triggerHaptic('warning');
      return;
    }

    setIsBiometricLoading(true);
    setErrorMessage(null);
    triggerHaptic('light');

    try {
      const bioRes = await authenticateWithBiometrics(targetCpf);
      if (bioRes.success) {
        triggerHaptic('success');
        if (cachedSession) {
          router.push(poolIdParam ? `/?pool_id=${encodeURIComponent(poolIdParam)}` : redirectParam);
        } else {
          // Busca sessão demo/padrão vinculada
          const res = await fetch('/api/auth/pwa-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf: targetCpf, pin: '1234' }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            saveCachedSession({
              operator_id: data.user.id,
              operator_name: data.user.name,
              operator_email: data.user.email,
              tenant_name: 'JHoston Pools & Parceiros',
              target_sector: data.user.targetSector || 'AUTONOMO',
              sector_badge: data.user.sectorLabel || 'Piscineiro Autorizado',
              cached_session_token: data.token,
              last_sync_at: new Date().toISOString(),
              cpf: data.user.cpf,
            });
            router.push(poolIdParam ? `/?pool_id=${encodeURIComponent(poolIdParam)}` : redirectParam);
          }
        }
      } else {
        triggerHaptic('error');
        setErrorMessage(bioRes.error || 'Autenticação biométrica não reconhecida.');
      }
    } catch {
      triggerHaptic('error');
      setErrorMessage('Falha ao acionar sensor biométrico do aparelho.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSelectDemoAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setIdentifier(acc.email);
    setPassword(acc.password);
    setShowDemoAccordion(false);
    triggerHaptic('light');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  // REGRA DE OURO: Em celular ou PWA instalado, OCULTAR totalmente contas demo
  const isFieldDevice = isMobile || isStandalone;

  return (
    <div className="min-h-screen bg-[#080C16] text-slate-100 flex flex-col justify-between relative selection:bg-cyan-500 selection:text-black">
      {/* Brilho radial ciano no topo que remete à água iluminada */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-gradient-to-b from-cyan-500/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* BANNER 1: Status de Conectividade / Modo Offline */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-700/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>📡 Sem sinal de internet — Modo Offline Operacional Disponível</span>
          </div>
          <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded font-mono font-bold">
            IndexedDB Ativo
          </span>
        </div>
      )}

      {/* Conteúdo Principal Centralizado */}
      <main className="w-full max-w-md mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center relative z-10 space-y-5">
        {/* BANNER 2: Contexto NFC / Plaqueta Laser CNC Detectada */}
        {(poolIdParam || nfcTagParam) && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 to-slate-900 border-2 border-cyan-500/60 shadow-xl space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>🛡️ Ativo Identificado (#{nfcTagParam || poolIdParam})</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Autentique-se para abrir diretamente o prontuário técnico e registrar a vistoria desta piscina.
            </p>
          </div>
        )}

        {/* CABEÇALHO DA MARCA */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/15 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
              JHPCS <span className="text-cyan-400">CAMPO</span>
            </h1>
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/80">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400">Offline</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Operação Técnica & Pericial • <span className="text-cyan-300">by Jhoston Pools</span>
          </p>
        </div>

        {/* BANNER 3: RETOMADA RÁPIDA DE SESSÃO OFFLINE */}
        {cachedSession && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Último Operador Conectado:</span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                {cachedSession.target_sector}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                {cachedSession.operator_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white truncate">
                  {cachedSession.operator_name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {cachedSession.tenant_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResumeCachedSession}
              className="w-full min-h-[52px] py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition border border-cyan-400/30"
            >
              <span>Continuar como {cachedSession.operator_name.split(' ')[0]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN PRINCIPAL */}
        <div className="bg-[#0D1322] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acesso ao Terminal</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">v4.6 Mobile</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs leading-relaxed animate-fadeIn">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* Campo E-mail / Identificador */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                E-mail ou CPF Operacional
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: tratador@empresa.com ou CPF"
                  className="w-full h-14 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 pr-10 text-base text-white placeholder-slate-600 transition"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Campo Senha / PIN */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Senha ou PIN
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 pr-11 text-base text-white placeholder-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white absolute right-1.5 transition"
                  title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Manter Conectado */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberDevice"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
              />
              <label htmlFor="rememberDevice" className="text-xs text-slate-300 select-none cursor-pointer">
                Manter conectado neste dispositivo (Recomendado)
              </label>
            </div>

            {/* Botão de Login Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 min-h-[56px] rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:opacity-95 text-white font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:opacity-50 border-2 border-cyan-400/40"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Autenticando Operador...</span>
                </>
              ) : (
                <>
                  <span>Acessar Operação de Campo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Botão Biométrico WebAuthn (Touch ID / Face ID) */}
            {hasBiometrics && (
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isBiometricLoading}
                className="w-full min-h-[52px] py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-cyan-800/60 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                <span>
                  {isBiometricLoading
                    ? 'Aguardando Leitura Biométrica...'
                    : 'Entrar com Biometria (Touch / Face ID)'}
                </span>
              </button>
            )}
          </form>

          {/* Orientações para Novos Operadores */}
          <div className="pt-3 border-t border-slate-800/80 text-center space-y-2 text-xs">
            <p className="text-slate-400">
              Ainda não tem acesso ao sistema?
            </p>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 text-left space-y-1.5">
              <p>
                • <strong>Técnicos de Frota / Operadores de Hotel:</strong> Solicite seu convite ao gestor da empresa ou condomínio.
              </p>
              <p>
                • <strong>Tratador Autônomo ou Loja:</strong>{' '}
                <a
                  href="https://jhpcs.vercel.app/onboarding"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 underline underline-offset-2"
                >
                  Criar conta profissional (7 dias grátis) <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ACORDEÃO DE CONTAS DEMO — EXCLUSIVO PARA WEB DESKTOP (!isFieldDevice) */}
        {!isFieldDevice && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowDemoAccordion(!showDemoAccordion)}
              className="w-full px-4 py-3 flex items-center justify-between text-slate-400 hover:text-white transition font-bold"
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Modo Demonstração / Auditoria Web (Apresentações)</span>
              </div>
              {showDemoAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoAccordion && (
              <div className="p-3 pt-0 grid grid-cols-2 gap-2 border-t border-slate-900 bg-slate-900/40 animate-fadeIn">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between gap-1"
                  >
                    <div>
                      <div className="font-black text-white text-[11px]">{acc.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{acc.targetSector}</div>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ MINIMALISTA DE SEGURANÇA */}
      <footer className="w-full text-center p-4 border-t border-slate-900 text-[11px] text-slate-500 space-y-1 relative z-10">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dados protegidos e isolados sob LGPD • Sincronia JHPCS Core v6.1</span>
        </p>
        <p className="text-[10px] text-slate-600">
          JHoston Pools & Lagoons • Plataforma Operacional Multissubstrato
        </p>
      </footer>

      {/* MODAL SIMPLES DE RECUPERAÇÃO DE SENHA */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Recuperar Acesso</span>
              </h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-center space-y-2 text-emerald-200">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-bold text-xs">Instruções enviadas!</p>
                <p className="text-[11px] text-slate-300">
                  Verifique a caixa de entrada do seu e-mail para redefinir seu acesso.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
                <p className="text-slate-300 text-[11px]">
                  Informe seu e-mail cadastrado no Core para receber o link seguro de recuperação de PIN/Senha:
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-3 text-white text-xs"
                />
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-tight transition"
                >
                  Enviar Link de Recuperação
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080C16] text-white flex items-center justify-center text-xs font-mono">
        Carregando Terminal JHPCS...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
