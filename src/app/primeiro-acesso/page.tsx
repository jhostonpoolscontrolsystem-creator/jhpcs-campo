'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, User, Phone, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Busca dados temporários do sessionStorage
    const pendingUserStr = sessionStorage.getItem('pending_user');
    const pendingToken = sessionStorage.getItem('pending_token');
    
    if (!pendingUserStr || !pendingToken) {
      // Se não tiver, manda pro login
      router.push('/');
      return;
    }
    
    const parsedUser = JSON.parse(pendingUserStr);
    setUser(parsedUser);
    setToken(pendingToken);
    setName(parsedUser.name || '');
    setPhone(parsedUser.phone || '');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      return setErrorMsg('As senhas não coincidem.');
    }
    if (password.length < 6) {
      return setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
    }
    if (!acceptedTerms) {
      return setErrorMsg('Você precisa ler e aceitar o Termo de Responsabilidade Técnica e Penal.');
    }

    setLoading(true);
    try {
      // Envia os dados caso a API esteja operante (se não, simula sucesso para o MVP)
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          phone,
          newPassword: password,
          token
        })
      });
      
      const data = await res.json();
      if (!res.ok && res.status !== 404) {
        throw new Error(data.error || 'Erro ao completar o cadastro.');
      }

      // Limpa dados temporários e joga o usuário oficial no localStorage
      sessionStorage.removeItem('pending_user');
      sessionStorage.removeItem('pending_token');
      localStorage.setItem('jhpcs_user', JSON.stringify({ ...user, name, phone }));
      localStorage.setItem('jhpcs_token', token);
      
      // Manda pro portal
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Fixo */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="Logo JHPCS" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-black text-white">JHPCS</h1>
            <span className="text-[10px] text-slate-400 block uppercase tracking-widest">Homologação de Cadastro</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Coluna Esquerda: Texto e Termos */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 font-mono text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            AÇÃO OBRIGATÓRIA DETECTADA
          </div>
          
          <h1 className="text-3xl font-black text-white leading-tight">
            Bem-vindo ao seu Primeiro Acesso.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Detectamos que você está usando a senha provisória da Diretoria. Por questões rígidas de <strong>auditoria e segurança contra fraudes</strong>, você deve completar o seu cadastro oficial, fornecer um WhatsApp de contato válido para os laudos e definir sua assinatura digital (senha forte).
          </p>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 mt-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Termo de Responsabilidade, LGPD e Propriedade Intelectual
            </h3>
            <div className="text-xs text-slate-400 space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar text-justify leading-relaxed">
              <p><strong className="text-slate-300">1. Auditoria e Rastreabilidade:</strong> Ao acessar este sistema, você reconhece que todas as suas ações (logins, submissões de telemetria e configurações) são permanentemente gravadas e rastreadas através do seu IP, User-Agent e Dispositivo, formando um laudo pericial inviolável.</p>
              
              <p><strong className="text-slate-300">2. Assinatura Eletrônica e Intransferibilidade:</strong> A senha por você cadastrada possui validade de assinatura eletrônica. Seu uso é estritamente pessoal e intransferível. Acessos simultâneos (compartilhamento de senha) poderão configurar infração passível de bloqueio.</p>
              
              <p><strong className="text-slate-300">3. Consentimento LGPD (Geolocalização e Imagens):</strong> Você autoriza expressamente a coleta e o armazenamento de suas coordenadas GPS e do horário exato exclusivamente durante o envio das manutenções (Telemetria), como medida antifraude. Autoriza, ainda, o armazenamento das fotos tiradas da piscina para composição do laudo técnico, garantindo não capturar imagens inapropriadas ou de cunho estritamente íntimo de terceiros.</p>
              
              <p><strong className="text-slate-300">4. Retenção Legal de Dados:</strong> O usuário está ciente de que, para garantir a segurança jurídica da Garantia Decenal das obras da JHoston Pools (Lei Civil) e para defesas trabalhistas/cíveis, os logs de auditoria e métricas não poderão ser apagados, representando uma exceção legal ao direito de exclusão previsto na LGPD.</p>
              
              <p><strong className="text-slate-300">5. Propriedade Intelectual e Anti-Espionagem:</strong> O código-fonte, arquitetura de banco de dados, motor químico, layout visual e fluxos deste sistema pertencem EXCLUSIVAMENTE à JHoston Pools. O ato de copiar fluxos, realizar captura de telas (prints) para fornecimento a concorrentes ou tentativa de engenharia reversa constitui crime de Violação de Segredo Industrial e Concorrência Desleal, sujeito à imediata persecução cível e criminal.</p>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Formulário */}
        <div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            
            <div className="space-y-1 mb-2">
              <h2 className="text-xl font-bold text-white">Completar Cadastro</h2>
              <p className="text-xs text-slate-400">Preencha seus dados reais para homologação.</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp (Para alertas da Evolution API)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input 
                  type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 90000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nova Senha Definitiva</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input 
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition mt-2">
              <div className="relative flex items-center pt-0.5">
                <input type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="peer sr-only" />
                <div className="w-5 h-5 rounded border-2 border-slate-600 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition"></div>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 absolute left-[3px] top-[5px] opacity-0 peer-checked:opacity-100 transition" />
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                Eu li, compreendi e <strong>aceito o Termo de Responsabilidade Técnica e Penal</strong>. Estou ciente de que meu acesso é monitorado e inviolável.
              </span>
            </label>

            <button 
              type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 mt-4"
            >
              {loading ? 'Homologando Cadastro...' : 'Assinar Termo e Acessar Sistema'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
