'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  RotateCcw, 
  Compass, 
  Layers, 
  User, 
  Fingerprint, 
  Bell, 
  Settings, 
  ArrowLeft,
  Scan,
  ShieldCheck,
  Building2,
  Truck,
  Zap,
  Sparkles,
  Sun
} from 'lucide-react';
import { useOutdoorDisplay } from '@/context/OutdoorDisplayContext';
import { triggerHaptic } from '@/lib/ui/haptics';
import { Pool } from '@/types/database';
import { mockPools } from '@/lib/mock-data';
import { TargetSector, DEMO_ACCOUNTS, TechnicianUserSession } from '@/types/profiles';
import { TechnicianCockpit } from '@/components/TechnicianCockpit';
import { SoloMaintenanceForm } from '@/components/profiles/SoloMaintenanceForm';
import { FleetMaintenanceForm } from '@/components/profiles/FleetMaintenanceForm';
import { FacilityMaintenanceForm } from '@/components/profiles/FacilityMaintenanceForm';
import { EnterpriseMaintenanceForm } from '@/components/profiles/EnterpriseMaintenanceForm';
import { PoolReportsDrawer } from '@/components/reports/PoolReportsDrawer';
import { 
  saveOfflineMaintenanceLog, 
  getPendingOfflineLogs, 
  removeOfflineLog,
  saveTechnicianProfile,
  getTechnicianProfile,
  getPredictiveAlertsOffline,
  acknowledgeAlertOffline,
  MaintenanceLogPayload 
} from '@/lib/offline-db';
import { runFullOfflineSync } from '@/lib/offline/syncEngine';
import { PoolWeatherAlert } from '@/types/weatherAlerts';
import { 
  saveCachedSession, 
  getCachedSession, 
  clearCachedSession,
  CachedSessionMetadata 
} from '@/lib/auth/cachedSession';
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm';
import { requestNotificationPermission } from '@/lib/firebase';
import { isBiometricsAvailable, authenticateWithBiometrics } from '@/lib/auth/webauthn';
import { compressImageToUltraLightWebP } from '@/lib/image-compressor';

export function MaintainerPwaWizard() {
  const { isOutdoorMode, toggleOutdoorMode } = useOutdoorDisplay();
  const [session, setSession] = useState<TechnicianUserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'COCKPIT' | 'WIZARD'>('COCKPIT');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingLogsCount, setPendingLogsCount] = useState<number>(0);

  // Seleção de Piscina
  const [pools, setPools] = useState<Pool[]>(mockPools);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('p-2');
  const activePool = pools.find((p) => p.id === selectedPoolId) || pools[0] || mockPools[0];

  // GPS em Tempo Real
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: -16.441123,
    lng: -39.071234,
  });

  // Perfil White-Label do Tratador (Modo Solo)
  const [brandName, setBrandName] = useState<string>('JHoston Pools Care');
  const [technicianWhatsapp, setTechnicianWhatsapp] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [monthlyPriceBrl, setMonthlyPriceBrl] = useState<number>(350);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Central de Relatórios e Fechamento Mensal
  const [isReportsDrawerOpen, setIsReportsDrawerOpen] = useState<boolean>(false);
  const [selectedReportPool, setSelectedReportPool] = useState<Pool | null>(null);

  // Alertas Meteorológicos Preditivos (48h)
  const [activeWeatherAlert, setActiveWeatherAlert] = useState<PoolWeatherAlert | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Estados de Login
  const [loginMethod, setLoginMethod] = useState<'DEMO' | 'CPF_PIN'>('DEMO');
  const [cpf, setCpf] = useState<string>('111.222.333-44');
  const [pin, setPin] = useState<string>('1234');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricLoading, setBiometricLoading] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Inicialização e Carregamento de Configurações
  useEffect(() => {
    getTechnicianProfile().then((prof) => {
      if (prof.brandName) setBrandName(prof.brandName);
      if (prof.whatsapp) setTechnicianWhatsapp(prof.whatsapp);
      if (prof.pixKey) setPixKey(prof.pixKey);
      if (prof.monthlyPriceBrl) setMonthlyPriceBrl(prof.monthlyPriceBrl);
    });

    isBiometricsAvailable().then((supported) => {
      setHasBiometrics(supported);
    });

    // Auto-restauração da sessão a partir do cachedSession
    const cached = getCachedSession();
    if (cached) {
      setSession({
        id: cached.operator_id,
        name: cached.operator_name,
        email: cached.operator_email || '',
        role: 'PISCINEIRO',
        cpf: cached.cpf || '',
        targetSector: cached.target_sector,
        token: cached.cached_session_token,
      });
      setIsAuthenticated(true);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // GPS contínuo
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.warn('GPS reading fallback:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [selectedPoolId]);

  // Carregar Alerta Meteorológico Preditivo para a piscina selecionada no IndexedDB
  useEffect(() => {
    async function loadAlertForSelectedPool() {
      try {
        const alerts = await getPredictiveAlertsOffline(selectedPoolId);
        const valid = alerts.find(
          (a) => !a.acknowledged && new Date(a.valid_until).getTime() > Date.now()
        );
        setActiveWeatherAlert(valid);
      } catch (err) {
        console.warn('Erro ao carregar alertas preditivos para a piscina:', err);
      }
    }
    loadAlertForSelectedPool();
  }, [selectedPoolId]);

  const checkOfflineQueue = async () => {
    try {
      const logs = await getPendingOfflineLogs();
      setPendingLogsCount(logs.length);
    } catch (err) {
      console.error('Erro ao ler IndexedDB:', err);
    }
  };

  const syncOfflineQueue = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      // Sincronização completa de ponta a ponta: logs pendentes + alertas preditivos 48h
      const syncResult = await runFullOfflineSync();
      console.log('[JHPCS Sync Engine Resultado]:', syncResult);
      await checkOfflineQueue();

      // Recarregar alertas para a piscina ativa
      const alerts = await getPredictiveAlertsOffline(selectedPoolId);
      const valid = alerts.find(
        (a) => !a.acknowledged && new Date(a.valid_until).getTime() > Date.now()
      );
      setActiveWeatherAlert(valid);
    } catch (err) {
      console.error('[JHPCS Sync Error]:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectDemoAccount = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/pwa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSession({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          cpf: data.user.cpf,
          targetSector: data.user.targetSector as TargetSector,
          token: data.token,
        });
        if (data.user.targetSector === 'AUTONOMO') {
          setBrandName('Silva Piscinas Pro');
        }
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Falha ao autenticar conta demo.');
      }
    } catch (err) {
      // Fallback offline para a conta demo selecionada
      setSession({
        id: `offline-${account.targetSector.toLowerCase()}`,
        name: account.name,
        email: account.email,
        role: 'PISCINEIRO',
        cpf: account.cpf,
        targetSector: account.targetSector,
        token: 'offline-token',
      });
      setIsAuthenticated(true);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCpfLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/pwa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, pin }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setSession({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || '',
          role: data.user.role,
          cpf: data.user.cpf,
          targetSector: (data.user.targetSector as TargetSector) || 'AUTONOMO',
          token: data.token,
        });
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setAuthError('Falha ao conectar ao servidor de login.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!cpf) return;
    setBiometricLoading(true);
    setAuthError(null);
    const bioRes = await authenticateWithBiometrics(cpf);
    if (bioRes.success) {
      setIsAuthenticated(true);
    } else {
      setAuthError(bioRes.error || 'Biometria não reconhecida.');
    }
    setBiometricLoading(false);
  };

  const handleToggleWebPush = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setPushEnabled(true);
      alert('Notificações de Roteiro e Alertas Sanitários ativadas!');
    } else {
      alert('Permissão de notificações não concedida no navegador.');
    }
  };

  // Upload Cloudflare R2
  const uploadEvidenceToR2 = async (photoBase64: string, evidenceType: string): Promise<string | null> => {
    try {
      const compressed = await compressImageToUltraLightWebP(photoBase64, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.75,
      });

      const formData = new FormData();
      formData.append('file', compressed.blob, `${evidenceType}_${Date.now()}.webp`);
      formData.append('evidence_type', evidenceType);
      formData.append('pool_id', selectedPoolId);

      const res = await fetch('/api/storage/upload-evidence', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.photo_url) {
        return data.photo_url;
      }
      return null;
    } catch (err) {
      console.warn(`[Upload R2 Fallback to Base64] ${evidenceType}:`, err);
      return null;
    }
  };

  const handleFormSubmit = async (logData: Partial<MaintenanceLogPayload>) => {
    const fullPayload: MaintenanceLogPayload = {
      id: `log-${Date.now()}`,
      pool_id: selectedPoolId,
      maintainer_id: session?.id || 'u-4',
      target_sector: session?.targetSector || 'AUTONOMO',
      ph: logData.ph ?? 7.4,
      chlorine_ppm: logData.chlorine_ppm ?? 2.0,
      acid_product_used: logData.acid_product_used ?? false,
      brushed_surface: logData.brushed_surface ?? true,
      backwashed_filter: logData.backwashed_filter ?? false,
      liability_accepted: true,
      gps_lat: currentGps.lat,
      gps_lng: currentGps.lng,
      evidences: logData.evidences || [],
      created_at: new Date().toISOString(),
      synced: false,
      ...logData,
    };

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/maintenance/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload),
        });
        if (!res.ok) throw new Error('Falha no envio online');
        console.log('[JHPCS] Laudo transmitido com sucesso ao Core v6.0.');
      } catch (e) {
        await saveOfflineMaintenanceLog(fullPayload);
        await checkOfflineQueue();
      }
    } else {
      await saveOfflineMaintenanceLog(fullPayload);
      await checkOfflineQueue();
    }

    // Se houve alerta preditivo climáticodo Core referenciado, dar baixa local no IndexedDB
    if (logData.acknowledgedAlertId) {
      await acknowledgeAlertOffline(logData.acknowledgedAlertId);
      setActiveWeatherAlert(undefined);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTechnicianProfile(brandName, technicianWhatsapp, pixKey, monthlyPriceBrl);
    setIsProfileModalOpen(false);
    alert('Identidade Comercial White-Label e Chave PIX salvas!');
  };

  // =========================================================================
  // TELA DE LOGIN UNIFICADA (Precision PoolTech + Resiliência Offline)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto animate-fadeIn">
        <UnifiedLoginForm
          onLoginSuccess={(newSession) => {
            setSession(newSession);
            setIsAuthenticated(true);
            if (newSession.targetSector === 'AUTONOMO') {
              setBrandName('Silva Piscinas Pro');
            }
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // CABEÇALHO DO APLICATIVO AUTENTICADO
  // =========================================================================
  const sector = session?.targetSector || 'AUTONOMO';

  return (
    <div className="space-y-4 animate-fadeIn max-w-md mx-auto pb-8">
      {/* Barra de Status e Perfil do Modo Conectado */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Wifi className="w-3.5 h-3.5" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 truncate max-w-[120px] font-bold">
            {sector === 'AUTONOMO' ? brandName : session?.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botão de Modo Outdoor High-Contrast (Sol Pleno) */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              toggleOutdoorMode();
            }}
            className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] font-bold ${
              isOutdoorMode
                ? 'bg-amber-400 border-amber-300 text-black shadow-md shadow-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Alternar Modo Outdoor Sol Pleno (Alto Contraste)"
          >
            <Sun className={`w-3.5 h-3.5 ${isOutdoorMode ? 'text-black' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{isOutdoorMode ? 'Sol Ativo' : 'Sol'}</span>
          </button>

          {activeTab === 'WIZARD' ? (
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('COCKPIT');
              }}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg transition"
            >
              <ArrowLeft className="w-3 h-3 text-cyan-400" />
              <span>Roteiro</span>
            </button>
          ) : (
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('WIZARD');
              }}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg transition"
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Atendimento</span>
            </button>
          )}

          <button
            onClick={handleToggleWebPush}
            className={`p-1.5 rounded-lg border transition ${
              pushEnabled
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Notificações Push"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Trocar de Conta / Sair e Ir para Login */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsAuthenticated(false);
            }}
            className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg transition"
            title="Trocar Perfil / Sair"
          >
            <span>Trocar</span>
          </button>

          {sector === 'AUTONOMO' && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 px-2 py-1 rounded-lg transition"
            >
              <Settings className="w-3 h-3 text-cyan-400" />
              <span>Marca</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Laudos Pendentes de Sincronização */}
      {pendingLogsCount > 0 && (
        <div className="bg-amber-950/80 border border-amber-800 text-amber-200 px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
            <span><strong>{pendingLogsCount}</strong> laudo(s) retido(s) no IndexedDB</span>
          </div>
          {isOnline && (
            <button
              onClick={syncOfflineQueue}
              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold"
            >
              Sincronizar
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COCKPIT DIÁRIO OU FORMULÁRIO POLIMÓRFICO                                  */}
      {/* ========================================================================= */}
      {activeTab === 'COCKPIT' ? (
        <TechnicianCockpit
          pools={pools}
          currentGps={currentGps}
          technicianName={session?.name || 'Tratador'}
          brandName={brandName}
          targetSector={sector}
          onSelectPoolToMaintain={(poolId) => {
            setSelectedPoolId(poolId);
            setActiveTab('WIZARD');
          }}
          onOpenPoolReports={(pool) => {
            setSelectedReportPool(pool);
            setIsReportsDrawerOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Seletor Rápido de Piscina no Topo do Wizard */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                Piscina Selecionada
              </span>
              <select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold mt-1"
              >
                {pools.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.volume_m3}m³ - {p.finish_type || 'Revestimento'})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('COCKPIT')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition shrink-0 mt-3"
            >
              Ver Rota
            </button>
          </div>

          {/* RENDERIZAÇÃO POLIMÓRFICA DO FORMULÁRIO BASEADA NO PERFIL */}
          {sector === 'AUTONOMO' && (
            <SoloMaintenanceForm
              pool={activePool}
              brandName={brandName}
              technicianWhatsapp={technicianWhatsapp}
              currentGps={currentGps}
              isOnline={isOnline}
              activeAlert={activeWeatherAlert}
              onSubmit={handleFormSubmit}
              onBackToCockpit={() => setActiveTab('COCKPIT')}
            />
          )}

          {sector === 'FROTA' && (
            <FleetMaintenanceForm
              pool={activePool}
              technicianName={session?.name || 'Técnico de Frota'}
              currentGps={currentGps}
              isOnline={isOnline}
              activeAlert={activeWeatherAlert}
              onSubmit={handleFormSubmit}
              onBackToCockpit={() => setActiveTab('COCKPIT')}
            />
          )}

          {sector === 'HOTEL_CLUBE' && (
            <FacilityMaintenanceForm
              pool={activePool}
              operatorName={session?.name || 'Operador Sanitário'}
              currentGps={currentGps}
              isOnline={isOnline}
              activeAlert={activeWeatherAlert}
              onSubmit={handleFormSubmit}
              onBackToCockpit={() => setActiveTab('COCKPIT')}
            />
          )}

          {sector === 'FABRICANTE' && (
            <EnterpriseMaintenanceForm
              pool={activePool}
              auditorName={session?.name || 'Auditor Jhoston'}
              currentGps={currentGps}
              isOnline={isOnline}
              activeAlert={activeWeatherAlert}
              onSubmit={handleFormSubmit}
              onBackToCockpit={() => setActiveTab('COCKPIT')}
            />
          )}
        </div>
      )}

      {/* Modal de Configurações White-Label (Apenas Autônomo) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Perfil Comercial (White-Label)</span>
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome da Sua Empresa / Apelido Profissional:
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Silva Piscinas Pro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  WhatsApp de Contato Comercial:
                </label>
                <input
                  type="text"
                  value={technicianWhatsapp}
                  onChange={(e) => setTechnicianWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Chave PIX (para cobrança no Fechamento Mensal):
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Ex: seu-email@pix.com.br ou CPF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Valor Padrão da Mensalidade (R$):
                </label>
                <input
                  type="number"
                  step="10"
                  value={monthlyPriceBrl}
                  onChange={(e) => setMonthlyPriceBrl(parseFloat(e.target.value) || 0)}
                  placeholder="350"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                Os comprovantes gerados no WhatsApp terão sua marca em destaque, chancelados pelo motor pericial JHPCS Engine.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
              >
                Salvar Identidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer da Central de Relatórios e Fechamento Mensal */}
      {isReportsDrawerOpen && selectedReportPool && (
        <PoolReportsDrawer
          isOpen={isReportsDrawerOpen}
          onClose={() => setIsReportsDrawerOpen(false)}
          pool={selectedReportPool}
          targetSector={sector}
          brandName={brandName}
          technicianWhatsapp={technicianWhatsapp}
          pixKey={pixKey}
          monthlyPriceBrl={monthlyPriceBrl}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}
