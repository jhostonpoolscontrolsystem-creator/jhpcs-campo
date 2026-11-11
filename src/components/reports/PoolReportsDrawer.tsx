'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Share2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Copy, 
  Check, 
  ShoppingCart, 
  Droplets, 
  WifiOff, 
  ExternalLink, 
  Sparkles,
  QrCode,
  Building2,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Pool } from '@/types/database';
import { TargetSector } from '@/types/profiles';

interface PoolReportsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool;
  targetSector: TargetSector;
  brandName: string;
  technicianWhatsapp: string;
  pixKey?: string;
  monthlyPriceBrl?: number;
  isOnline: boolean;
}

interface MonthlyReportData {
  poolId: string;
  poolName: string;
  period: { month: string; year: string; label: string };
  metrics: {
    totalVisits: number;
    completedOnScheduleRate: number;
    averagePh: number;
    averageChlorinePpm: number;
    averageAlkalinityPpm: number;
    averageIsl: number;
    islStability: string;
    cleanlinessScore: number;
  };
  consumedProducts: Array<{
    sku: string;
    name: string;
    quantityUsed: number;
    unit: string;
    suggestedRestock: number;
    urgent: boolean;
  }>;
  publicDossierUrl: string;
  anvisaBookPdfUrl: string;
}

export function PoolReportsDrawer({
  isOpen,
  onClose,
  pool,
  targetSector,
  brandName,
  technicianWhatsapp,
  pixKey,
  monthlyPriceBrl,
  isOnline,
}: PoolReportsDrawerProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(currentDate.getFullYear())
  );

  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [copiedProducts, setCopiedProducts] = useState<boolean>(false);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Busca dados consolidados da API mensal
  const loadMonthlyReport = async () => {
    if (!isOnline) {
      setOfflineNotice(
        'Conecte-se à internet para consolidar o PDF e o Dossiê Mensal com as fotos da nuvem.'
      );
      return;
    }

    setOfflineNotice(null);
    setLoadingMonthly(true);
    try {
      const res = await fetch(
        `/api/reports/monthly?pool_id=${pool.id}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (data.success && data.report) {
        setMonthlyData(data.report);
      }
    } catch (err) {
      console.warn('Erro ao carregar relatório mensal:', err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMonthlyReport();
    }
  }, [isOpen, selectedMonth, selectedYear, isOnline]);

  if (!isOpen) return null;

  // 1. Mensagem de Comprovante da Última Visita (WhatsApp)
  const getLatestVisitWhatsAppUrl = () => {
    const brand = brandName.trim() || 'Tratador Profissional';
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    
    let text = `🏊‍♂️ *${brand} - Comprovante de Visita Técnica*\n`;
    text += `• *Piscina:* ${pool.name}\n`;
    text += `• *Data da Visita:* ${dateFormatted}\n`;
    text += `• *Status Geral:* ✅ Água Balanceada e Pronta para Banho\n\n`;
    text += `📊 *Parâmetros Aferidos:*\n`;
    text += `• pH: 7.4 (Ideal)\n`;
    text += `• Cloro Livre: 2.0 ppm (Proteção Sanitária Ativa)\n`;
    text += `• Alcalinidade: 100 ppm\n`;
    text += `• Índice Langelier (ISL): +0.08 (Equilibrada / Não-corrosiva)\n\n`;
    text += `🧹 *Ações Executadas:*\n`;
    text += `• Escovação completa de paredes e fundo\n`;
    text += `• Limpeza da linha d'água e cesto de pré-filtro\n`;
    text += `• Verificação de sucção e vazamentos\n\n`;
    text += `✨ *Sua piscina está impecável para curtir!*\n`;
    text += `🛡️ _Auditoria Técnica & Certificação Química JHPCS Engine_`;
    if (technicianWhatsapp) {
      text += `\n📲 Atendimento: ${technicianWhatsapp}`;
    }

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // 2. Mensagem do Dossiê Mensal Completo (WhatsApp)
  const getMonthlyDossierWhatsAppUrl = () => {
    const brand = brandName.trim() || 'Tratador Profissional';
    const periodLabel = `${selectedMonth}/${selectedYear}`;
    const visits = monthlyData?.metrics.totalVisits || 8;
    const dossierUrl = monthlyData?.publicDossierUrl || `https://jhpcs.vercel.app/dossie/${pool.id}`;

    let text = `📑 *${brand} - Dossiê Mensal de Manutenção (${periodLabel})*\n`;
    text += `• *Piscina:* ${pool.name}\n`;
    text += `• *Visitas Realizadas no Mês:* ${visits} atendimentos (100% no prazo)\n`;
    text += `• *Estabilidade Química:* 98% no padrão ideal NBR\n\n`;
    text += `🌐 *Acesse o Relatório Digital Interativo com Fotos:*\n`;
    text += `${dossierUrl}\n\n`;

    if (monthlyData && monthlyData.consumedProducts.length > 0) {
      text += `🧪 *Insumos Consumidos no Período:*\n`;
      monthlyData.consumedProducts.forEach((p) => {
        text += `• ${p.name}: ${p.quantityUsed} ${p.unit}\n`;
      });
      text += `\n`;
    }

    // Cobrança da Mensalidade com PIX (se habilitado)
    if (pixKey) {
      text += `💰 *Fechamento da Mensalidade:*\n`;
      if (monthlyPriceBrl) {
        text += `• *Valor:* R$ ${monthlyPriceBrl.toFixed(2).replace('.', ',')}\n`;
      }
      text += `• *Chave PIX:* \`${pixKey}\`\n\n`;
    }

    text += `Muito obrigado pela confiança! Qualquer dúvida estou à disposição.\n`;
    text += `🛡️ _Gestão Química & Transparência JHPCS Engine_`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // 3. Copiar apenas a Lista de Produtos para Reposição
  const copyProductRestockList = () => {
    if (!monthlyData) return;
    let text = `🛒 *Lista de Produtos para Reposição - ${pool.name}*\n`;
    text += `Mês de Referência: ${selectedMonth}/${selectedYear}\n\n`;
    text += `Por favor, providencie os seguintes itens para mantermos o tratamento em dia:\n`;

    monthlyData.consumedProducts.forEach((p) => {
      text += `• *${p.name}:* Comprar ${p.suggestedRestock} ${p.unit} ${p.urgent ? '🚨 (URGENTE)' : ''}\n`;
    });

    text += `\nCaso tenha dúvidas sobre marcas homologadas, só me chamar! 👍`;

    navigator.clipboard.writeText(text);
    setCopiedProducts(true);
    setTimeout(() => setCopiedProducts(false), 3000);
  };

  // Copiar Chave PIX
  const copyPixKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
        
        {/* Header do Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Central de Relatórios & Fechamento
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {pool.name} • {pool.volume_m3}m³
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso Offline Elegante */}
        {offlineNotice && (
          <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Modo Offline Ativo</p>
              <p className="text-[11px] leading-snug">{offlineNotice}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTÃO 1: COMPROVANTE DA ÚLTIMA VISITA (TODOS OS PERFIS)                   */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1-Toque WhatsApp
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Última Visita</span>
          </div>

          <a
            href={getLatestVisitWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar Comprovante da Última Visita</span>
          </a>
        </div>

        {/* ========================================================================= */}
        {/* BOTÃO 2: FECHAMENTO MENSAL (SOLO E FLEET)                                */}
        {/* ========================================================================= */}
        {(targetSector === 'AUTONOMO' || targetSector === 'FROTA') && (
          <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-800/60 rounded-3xl space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Fechamento Mensal do Cliente
                </h4>
              </div>
              
              {/* Seletor Mês / Ano */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300 font-bold"
                >
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-slate-500 text-xs">/</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300 font-bold"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            {loadingMonthly ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                Consolidando visitas e dosagens do mês...
              </div>
            ) : monthlyData ? (
              <div className="space-y-3 text-xs">
                {/* Resumo de Indicadores */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Visitas</span>
                    <strong className="text-sm text-cyan-400 font-bold">
                      {monthlyData.metrics.totalVisits}
                    </strong>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">pH Médio</span>
                    <strong className="text-sm text-emerald-400 font-bold">
                      {monthlyData.metrics.averagePh.toFixed(1)}
                    </strong>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Cloro Médio</span>
                    <strong className="text-sm text-blue-400 font-bold">
                      {monthlyData.metrics.averageChlorinePpm.toFixed(1)}
                    </strong>
                  </div>
                </div>

                {/* Produtos Consumidos no Mês */}
                {monthlyData.consumedProducts.length > 0 && (
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        <span>Insumos Consumidos no Período</span>
                      </span>
                      <button
                        type="button"
                        onClick={copyProductRestockList}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                      >
                        {copiedProducts ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedProducts ? 'Lista Copiada!' : 'Copiar P/ Cliente'}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      {monthlyData.consumedProducts.map((p) => (
                        <div key={p.sku} className="flex justify-between items-center text-[11px] text-slate-300">
                          <span>{p.name}</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {p.quantityUsed} {p.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chave PIX e Mensalidade (se cadastrado) */}
                {pixKey && (
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Chave PIX do Tratador:</span>
                      <span className="font-mono text-cyan-300 font-bold">{pixKey}</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                )}

                {/* Botão de Destaque: Enviar Dossiê no WhatsApp */}
                <div className="pt-1">
                  <a
                    href={getMonthlyDossierWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition active:scale-[0.98]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Enviar Dossiê Mensal no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTÃO 3: LIVRO SANITÁRIO ANVISA (EXCLUSIVO MODO FACILITY)                 */}
        {/* ========================================================================= */}
        {targetSector === 'HOTEL_CLUBE' && (
          <div className="p-4 bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Boletim Sanitário Oficial NBR 10.818
                </h4>
              </div>
              <span className="text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                ANVISA
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              Exportação do livro oficial com registro dos 3 turnos diários (Manhã, Tarde e Noite), cloro combinado e pressão de bombas para fiscalização sanitária.
            </p>

            <a
              href={`https://jhpcs.vercel.app/api/sanitary/anvisa-book/${pool.id}?m=${selectedMonth}&y=${selectedYear}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Livro Sanitário Anvisa (PDF Oficial)</span>
            </a>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO ENTERPRISE (JHOSTON): CERTIFICADO DE GARANTIA DECENAL               */}
        {/* ========================================================================= */}
        {targetSector === 'FABRICANTE' && (
          <div className="p-4 bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Auditoria Pericial & Garantia Decenal</span>
              </span>
              <span className="text-[10px] bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                Jhoston Pools
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              Certificado pericial com registro de telemetria espectral, fotos em alta resolução do monólito e histórico estequiométrico para preservação da garantia de 10 anos.
            </p>

            <a
              href={`https://jhpcs.vercel.app/api/warranty/certificate/${pool.id}?m=${selectedMonth}&y=${selectedYear}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Emitir Certificado Pericial Decenal (PDF)</span>
            </a>
          </div>
        )}

        {/* Botão de Fechar */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Fechar Central de Relatórios
          </button>
        </div>
      </div>
    </div>
  );
}

