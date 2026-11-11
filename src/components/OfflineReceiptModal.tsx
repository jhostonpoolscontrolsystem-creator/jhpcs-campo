'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Receipt, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Share2, 
  Printer,
  ShieldCheck,
  Building,
  QrCode
} from 'lucide-react';
import { AppliedProductPayload } from '@/lib/offline-db';
import { OFFLINE_CHEMICAL_CATALOG } from '@/lib/fiscal/offlineFiscalCatalog';

interface OfflineReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolName: string;
  technicianName: string;
  brandName: string;
  technicianWhatsapp: string;
  productsApplied: AppliedProductPayload[];
  laborCostBrl?: number;
}

export function OfflineReceiptModal({
  isOpen,
  onClose,
  poolName,
  technicianName,
  brandName,
  technicianWhatsapp,
  productsApplied,
  laborCostBrl = 180.0,
}: OfflineReceiptModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [clientCpf, setClientCpf] = useState('');
  const [receiptNumber] = useState(`REC-${Date.now().toString().slice(-6)}`);
  const [contingencyKey] = useState(`SEFAZ-CONT-35${Date.now()}55001000${Math.floor(1000 + Math.random() * 9000)}`);

  if (!isOpen) return null;

  // Calcula valores
  const totalProductsBrl = productsApplied.reduce((acc, item) => {
    const catalogItem = OFFLINE_CHEMICAL_CATALOG.find((c) => c.sku === item.sku);
    const unitPrice = catalogItem?.precoPadraoBrl || item.precoPadraoBrl || 35.0;
    return acc + item.quantityUsed * unitPrice;
  }, 0);

  const grandTotalBrl = totalProductsBrl + laborCostBrl;
  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Texto formatado para envio no WhatsApp
  const generateReceiptWhatsAppText = () => {
    let t = `🧾 *CUPOM DE ATENDIMENTO & RECIBO DE SERVIÇO*\n`;
    t += `🏢 *Emissor:* ${brandName}\n`;
    t += `👨‍🔧 *Tratador Técnico:* ${technicianName}\n`;
    t += `🏊 *Piscina:* ${poolName}\n`;
    t += `📅 *Data:* ${dateFormatted} às ${timeFormatted}\n`;
    t += `🔢 *Nº Recibo:* ${receiptNumber}\n`;
    t += `🔐 *Chave de Contingência Sefaz:* ${contingencyKey.slice(0, 20)}...\n\n`;

    t += `🛠️ *Serviço Realizado:*\n`;
    t += `• Manutenção e Balanceamento Físico-Químico: R$ ${laborCostBrl.toFixed(2)}\n\n`;

    if (productsApplied.length > 0) {
      t += `📦 *Insumos Químicos Aplicados (NCM):*\n`;
      productsApplied.forEach((p) => {
        const cat = OFFLINE_CHEMICAL_CATALOG.find((c) => c.sku === p.sku);
        const price = cat?.precoPadraoBrl || p.precoPadraoBrl || 35.0;
        const total = (p.quantityUsed * price).toFixed(2);
        t += `• ${p.name || p.sku} (${p.quantityUsed}${p.unidade || 'kg'} x R$${price.toFixed(2)}) = R$ ${total}\n  _NCM: ${cat?.ncm || '28289011'} | CFOP: 5102_\n`;
      });
      t += `• *Subtotal de Produtos:* R$ ${totalProductsBrl.toFixed(2)}\n\n`;
    }

    t += `💰 *VALOR TOTAL DO ATENDIMENTO: R$ ${grandTotalBrl.toFixed(2)}*\n\n`;
    t += `✅ _Auditoria Pericial e Estequiométrica JHoston Pools Control System_\n`;
    t += `🛡️ _Garantia Técnica Assegurada_`;
    if (technicianWhatsapp) {
      t += `\n📞 Dúvidas ou Suporte: ${technicianWhatsapp}`;
    }

    return encodeURIComponent(t);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 animate-fadeIn shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cupom de Atendimento Fiscal</h3>
              <p className="text-[10px] text-slate-400">Contingência Offline • Recibo de Campo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cupom Estilo Térmico (Print-Ready) */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300 shadow-inner">
          <div className="text-center pb-2 border-b border-dashed border-slate-700">
            <p className="font-bold text-sm text-white tracking-wide">{brandName}</p>
            <p className="text-[10px] text-slate-400">Tratamento e Manutenção de Piscinas</p>
            <p className="text-[10px] text-slate-500">Resp. Técnico: {technicianName}</p>
          </div>

          <div className="text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Recibo:</span>
              <span className="font-bold text-white">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Data/Hora:</span>
              <span>{dateFormatted} {timeFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>Piscina:</span>
              <span className="text-white truncate max-w-[150px]">{poolName}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-700 pt-2 space-y-1 text-[11px]">
            <p className="font-bold text-slate-400">ITENS E SERVIÇOS:</p>
            <div className="flex justify-between">
              <span>Manutenção Técnica</span>
              <span>R$ {laborCostBrl.toFixed(2)}</span>
            </div>

            {productsApplied.map((p) => {
              const cat = OFFLINE_CHEMICAL_CATALOG.find((c) => c.sku === p.sku);
              const price = cat?.precoPadraoBrl || p.precoPadraoBrl || 35.0;
              const total = (p.quantityUsed * price).toFixed(2);
              return (
                <div key={p.sku} className="space-y-0.5">
                  <div className="flex justify-between text-slate-200">
                    <span className="truncate max-w-[180px]">{p.name || p.sku}</span>
                    <span>R$ {total}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Qtd: {p.quantityUsed}{p.unidade || 'kg'} x R${price.toFixed(2)}</span>
                    <span>NCM: {cat?.ncm || '28289011'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-white">
            <span>TOTAL GERAL:</span>
            <span className="text-emerald-400">R$ {grandTotalBrl.toFixed(2)}</span>
          </div>

          {/* Chave de Contingência Sefaz */}
          <div className="pt-2 border-t border-dashed border-slate-700 text-[9px] text-slate-500 text-center space-y-1">
            <p className="font-bold text-slate-400">EMITIDO EM CONTINGÊNCIA OFFLINE</p>
            <p className="break-all">{contingencyKey}</p>
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-sans text-[10px] pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Homologado pelo Motor Fiscal JHPCS</span>
            </div>
          </div>
        </div>

        {/* CPF do Cliente para Nota Fiscal */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            CPF do Cliente na Nota (Opcional):
          </label>
          <input
            type="text"
            value={clientCpf}
            onChange={(e) => setClientCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://wa.me/?text=${generateReceiptWhatsAppText()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

