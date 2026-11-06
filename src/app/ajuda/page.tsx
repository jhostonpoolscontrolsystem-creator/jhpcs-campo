'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Smartphone,
  WifiOff,
  Camera,
  Droplet,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  MessageCircleQuestion,
  RotateCcw,
  Zap,
  PhoneCall
} from 'lucide-react';
import Link from 'next/link';

interface HelpTopic {
  id: string;
  category: 'instalacao' | 'rotina' | 'offline' | 'cameras' | 'quimica';
  title: string;
  badge: string;
  icon: any;
  summary: string;
  steps: string[];
  alert?: string;
  faq?: { q: string; a: string }[];
}

export default function AjudaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('rotina-passo-a-passo');
  const [searchQuery, setSearchQuery] = useState('');

  const topics: HelpTopic[] = [
    {
      id: 'instalacao-pwa',
      category: 'instalacao',
      title: 'Como Instalar o App no Celular (Android e iPhone)',
      badge: 'Instalação Rápida',
      icon: Smartphone,
      summary: 'Adicione o ícone do JHPCS Tratador na tela do seu celular para abrir em tela cheia mesmo sem internet.',
      steps: [
        'No Android (Chrome): Toque nos 3 pontinhos (⋮) no canto superior direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".',
        'No iPhone (Safari): Toque no botão de Compartilhar (quadrado com seta para cima ⬆) e selecione "Adicionar à Tela de Início".',
        'Após adicionar, abra o aplicativo sempre pelo ícone na tela inicial para ter a experiência de aplicativo nativo.'
      ],
      alert: 'Não é necessário procurar em lojas como Google Play ou App Store. O PWA funciona direto no navegador.',
      faq: [
        {
          q: 'Preciso atualizar o aplicativo na loja?',
          a: 'Não. Sempre que você estiver conectado à internet, o app se atualiza sozinho automaticamente.'
        }
      ]
    },
    {
      id: 'rotina-passo-a-passo',
      category: 'rotina',
      title: 'Roteiro de Campo Passo a Passo',
      badge: 'Operação Diária',
      icon: Droplet,
      summary: 'Como fazer o checklist completo da piscina em menos de 2 minutos com segurança e respaldo técnico.',
      steps: [
        '1. Selecione a Piscina no topo da tela para carregar o volume em m³ e dados de revestimento.',
        '2. Insira as medições de pH, Cloro Livre, Alcalinidade e Dureza Cálcica coletadas no estojo ou fita.',
        '3. Marque os itens do Checklist Físico (escovação de paredes, retrolavagem de filtro, aspiração).',
        '4. Tire as 2 fotos obrigatórias: Foto Panorâmica da Piscina e Foto da Fita/Estojo de Teste.',
        '5. Confira a dosagem recomendada na tela e toque em "Finalizar e Transmitir Laudo".'
      ],
      alert: 'Ao finalizar, o laudo é enviado imediatamente por WhatsApp ao cliente e registrado no prontuário da piscina.',
      faq: [
        {
          q: 'E se eu errar uma medição?',
          a: 'Você pode ajustar os valores livremente antes de tocar em "Finalizar e Transmitir Laudo". Após transmitido, um novo laudo de correção deve ser enviado.'
        }
      ]
    },
    {
      id: 'modo-offline',
      category: 'offline',
      title: 'Trabalhando Sem Sinal de Internet (Modo Offline)',
      badge: 'Conectividade Zero',
      icon: WifiOff,
      summary: 'O aplicativo funciona perfeitamente em casas de máquinas subterrâneas ou sítios sem sinal 4G.',
      steps: [
        'Abra o aplicativo normalmente mesmo se estiver sem conexão ou em modo avião.',
        'Preencha todas as medições e tire as fotos normalmente.',
        'Ao tocar em "Finalizar Laudo", o sistema salva tudo com segurança no banco de dados interno (IndexedDB).',
        'Assim que seu celular recuperar sinal 4G ou Wi-Fi, o aplicativo sincroniza automaticamente sem você precisar refazer nada.'
      ],
      alert: 'Você verá um contador no topo do app indicando quantos atendimentos estão aguardando sinal para envio.',
      faq: [
        {
          q: 'Posso fechar o app enquanto não tenho sinal?',
          a: 'Sim! Os dados ficam gravados com segurança na memória do celular e não se perdem mesmo se o telefone for reiniciado.'
        }
      ]
    },
    {
      id: 'camera-evidencias',
      category: 'cameras',
      title: 'Fotos de Evidência e Trava Anti-Fraude com GPS',
      badge: 'Respaldo Jurídico',
      icon: Camera,
      summary: 'Entenda por que as fotos exigem localização e como elas protegem você de reclamações de clientes.',
      steps: [
        'Permita o acesso à Câmera e Localização (GPS) quando o navegador solicitar.',
        'A foto panorâmica deve enquadrar a piscina inteira com a lâmina d’água visível e limpa.',
        'A foto do reagente deve mostrar as cores nítidas do tubo comparador ou fita de teste.',
        'O sistema carimba automaticamente as coordenadas de satélite (latitude e longitude) e horário exato.'
      ],
      alert: 'Isso comprova perante a diretoria e proprietário que você esteve fisicamente no local no horário agendado.',
      faq: [
        {
          q: 'O que fazer se a câmera não abrir?',
          a: 'Verifique se nas configurações do seu navegador (Chrome ou Safari) a permissão de câmera está habilitada para o site.'
        }
      ]
    },
    {
      id: 'assistentes-ia',
      category: 'quimica',
      title: 'Scanner com IA da Fita e Inspeção do Revestimento',
      badge: 'Inteligência Artificial',
      icon: Sparkles,
      summary: 'Use os assistentes de visão computacional para ler fitas reagentes e diagnosticar manchas.',
      steps: [
        'Toque em "Scanner de Fita IA" e aponte a câmera para a fita de 4 almofadas químicas.',
        'A IA lê automaticamente os tons de cor e preenche pH e Cloro para você.',
        'Em caso de manchas, use "Inspeção de Superfície IA" para identificar se é calcificação ou biofilme.'
      ],
      alert: 'As ferramentas com IA são assistentes recomendatórios; você sempre pode calibrar os valores manualmente.'
    }
  ];

  const filteredTopics = topics.filter((t) => {
    const matchesCategory = selectedCategory === 'todos' || t.category === selectedCategory;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header Fixo de Navegação */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Roteiro</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">CENTRO DE AJUDA</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.5 rounded font-mono">
              CAMPO
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full p-4 flex-1 flex flex-col gap-4">
        {/* Banner de Boas-Vindas */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Guia do Tratador de Campo</h1>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Tudo o que você precisa saber para operar o app, coletar medições e garantir o respaldo do seu serviço.
              </p>
            </div>
          </div>

          {/* Busca Rápida */}
          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar dúvida (ex: offline, foto, cloro)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Filtro por Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Tudo' },
            { id: 'rotina', label: 'Rotina Diária' },
            { id: 'offline', label: 'Sem Internet' },
            { id: 'cameras', label: 'Fotos & GPS' },
            { id: 'instalacao', label: 'Como Instalar' },
            { id: 'quimica', label: 'Dicas Químicas' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Tópicos Accordion */}
        <div className="flex flex-col gap-3">
          {filteredTopics.map((topic) => {
            const Icon = topic.icon;
            const isExpanded = expandedTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                          {topic.badge}
                        </span>
                      </div>
                      <h2 className="text-sm font-semibold text-white mt-1">{topic.title}</h2>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {topic.summary}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-500 mt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 flex flex-col gap-3">
                    {/* Passo a Passo */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        Instruções
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {topic.steps.map((step, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50 flex items-start gap-2"
                          >
                            <span className="text-cyan-400 font-bold text-[11px] shrink-0">
                              {idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Alerta Destacado */}
                    {topic.alert && (
                      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/90 leading-relaxed">{topic.alert}</p>
                      </div>
                    )}

                    {/* Perguntas Frequentes do Tópico */}
                    {topic.faq && topic.faq.length > 0 && (
                      <div className="mt-1">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <MessageCircleQuestion className="w-3.5 h-3.5 text-cyan-400" />
                          Dúvidas Frequentes
                        </h4>
                        <div className="flex flex-col gap-2">
                          {topic.faq.map((f, i) => (
                            <div
                              key={i}
                              className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40"
                            >
                              <p className="text-xs font-semibold text-slate-200">{f.q}</p>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Card de Suporte Técnico WhatsApp */}
        <div className="mt-2 bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Precisa de Ajuda Imediata?</h3>
              <p className="text-[11px] text-slate-400">Contate a Coordenação Técnica JHoston</p>
            </div>
          </div>
          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1%2C+preciso+de+suporte+no+App+JHPCS-CAMPO"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1"
          >
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </main>
    </div>
  );
}

