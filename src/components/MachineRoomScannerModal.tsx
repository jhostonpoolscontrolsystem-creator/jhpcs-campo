'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Nfc, 
  QrCode, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface MachineRoomScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess: (tagData: { poolId: string; tagCode: string; roomName: string }) => void;
  availablePools: Array<{ id: string; name: string }>;
}

export function MachineRoomScannerModal({
  isOpen,
  onClose,
  onCheckInSuccess,
  availablePools,
}: MachineRoomScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'NFC' | 'QR' | 'MANUAL'>('QR');
  const [nfcReading, setNfcReading] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  if (!isOpen) return null;

  // Leitura NFC via Web NFC API (Android Chrome)
  const startNfcScan = async () => {
    setNfcReading(true);
    setFeedbackMsg(null);

    try {
      // @ts-ignore
      const ndef = new NDEFReader();
      await ndef.scan();
      setFeedbackMsg({
        type: 'success',
        text: 'Aproxime a traseira do celular da Tag NFC da Casa de Máquinas...',
      });

      // @ts-ignore
      ndef.onreading = (event: any) => {
        const serialNumber = event.serialNumber || 'NFC-TAG-01';
        let textContent = '';
        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding);
            textContent = textDecoder.decode(record.data);
          }
        }

        const resolvedCode = textContent || serialNumber;
        const matchedPool = availablePools[0]; // Associa à primeira piscina ou parse do JSON da tag

        onCheckInSuccess({
          poolId: matchedPool ? matchedPool.id : 'p-2',
          tagCode: resolvedCode,
          roomName: matchedPool ? matchedPool.name : 'Casa de Máquinas Central',
        });
        onClose();
      };
    } catch (err: any) {
      setNfcReading(false);
      setFeedbackMsg({
        type: 'error',
        text: `NFC indisponível ou permissão negada: ${err.message}`,
      });
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const matchedPool = availablePools.find(
      (p) => p.name.toLowerCase().includes(manualCode.toLowerCase()) || p.id === manualCode
    ) || availablePools[0];

    onCheckInSuccess({
      poolId: matchedPool.id,
      tagCode: manualCode.toUpperCase(),
      roomName: matchedPool.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 animate-fadeIn shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Check-in de Casa de Máquinas</h3>
              <p className="text-[10px] text-slate-400">Autenticação Instantânea por Tag</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas de Escaneamento */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            className={`py-2 rounded-lg transition ${
              activeTab === 'QR' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NFC')}
            className={`py-2 rounded-lg transition ${
              activeTab === 'NFC' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Tag NFC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`py-2 rounded-lg transition ${
              activeTab === 'MANUAL' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Código
          </button>
        </div>

        {/* Conteúdo da Aba QR Code */}
        {activeTab === 'QR' && (
          <div className="space-y-3 text-center py-2">
            <div className="relative mx-auto w-44 h-44 rounded-2xl border-2 border-dashed border-cyan-500/60 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
              <QrCode className="w-16 h-16 text-cyan-400 animate-pulse" />
              <div className="absolute inset-x-0 top-0 h-1 bg-cyan-400 animate-bounce opacity-80" />
              <span className="text-[10px] text-slate-400 mt-2">Aponte para a placa de patrimônio</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const pool = availablePools[0];
                onCheckInSuccess({
                  poolId: pool.id,
                  tagCode: 'QR-JHPCS-QUADRO-01',
                  roomName: pool.name,
                });
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Simular Leitura de QR Code</span>
            </button>
          </div>
        )}

        {/* Conteúdo da Aba NFC */}
        {activeTab === 'NFC' && (
          <div className="space-y-3 text-center py-3">
            <div className="mx-auto w-20 h-20 rounded-full bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Nfc className={`w-10 h-10 ${nfcReading ? 'animate-pulse text-cyan-300' : ''}`} />
            </div>

            <div>
              <p className="text-xs font-bold text-white">Leitura por Aproximação (NFC)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {nfcSupported
                  ? 'Toque na tag NFC metálica fixada no quadro elétrico'
                  : 'Web NFC suportado em navegadores Chrome para Android'}
              </p>
            </div>

            <button
              type="button"
              onClick={startNfcScan}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md transition"
            >
              {nfcReading ? 'Aguardando Tag...' : 'Ativar Sensor NFC'}
            </button>
          </div>
        )}

        {/* Conteúdo da Aba Manual */}
        {activeTab === 'MANUAL' && (
          <form onSubmit={handleManualCheckIn} className="space-y-3 py-1 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Código da Placa ou Tag do Quadro:
              </label>
              <input
                type="text"
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: TAG-POOLS-0042"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
            >
              Validar Check-in
            </button>
          </form>
        )}

        {feedbackMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : 'bg-red-950/60 border border-red-800 text-red-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span className="text-[11px]">{feedbackMsg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

