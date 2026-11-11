/**
 * Definição Canônica dos Perfis Operacionais do PWA JHPCS-Campo
 * Permite adaptar dinamicamente o aplicativo conforme o público-alvo (Polimórfico).
 */

export type TargetSector = 
  | 'AUTONOMO'     // Modo SOLO: Tratador autônomo individual
  | 'FROTA'         // Modo FLEET: Técnico de empresa de manutenção / prestadora
  | 'HOTEL_CLUBE'   // Modo FACILITY: Operador de Hotel, Resort ou Condomínio (NBR 10.818)
  | 'FABRICANTE';   // Modo ENTERPRISE: Auditoria Técnica & Garantia Jhoston Pools

export interface TechnicianUserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  targetSector: TargetSector;
  companyName?: string;
  vehiclePlate?: string;
  token: string;
}

export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  cpf: string;
  targetSector: TargetSector;
  sectorLabel: string;
  badgeColor: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'teste.solo@teste.com',
    password: 'teste123',
    name: 'Marcos Silva (Tratador Solo)',
    cpf: '111.222.333-44',
    targetSector: 'AUTONOMO',
    sectorLabel: 'MODO SOLO (Autônomo)',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    description: 'Interface ultrarrápida, sem travas de GPS, foco em rota pessoal e comprovante com marca própria.',
  },
  {
    email: 'teste.frota@teste.com',
    password: 'teste123',
    name: 'Roberto Mendes (Técnico Frota #04)',
    cpf: '222.333.444-55',
    targetSector: 'FROTA',
    sectorLabel: 'MODO FLEET (Empresa / Frota)',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    description: 'Trava rígida de Geofencing 50m, baixa de estoque da caminhonete e assinatura digital do cliente.',
  },
  {
    email: 'teste.facility@teste.com',
    password: 'teste123',
    name: 'Eduardo Santos (Operador Resort Terravista)',
    cpf: '333.444.555-66',
    targetSector: 'HOTEL_CLUBE',
    sectorLabel: 'MODO FACILITY (Hotel & Condomínio)',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    description: 'Formulário Sanitário NBR 10.818 (ANVISA), turnos manhã/tarde/noite, cloro combinado e pressão do filtro.',
  },
  {
    email: 'teste.jhoston@teste.com',
    password: 'teste123',
    name: 'Carlos Oliveira (Auditor Jhoston Pools)',
    cpf: '444.555.666-77',
    targetSector: 'FABRICANTE',
    sectorLabel: 'MODO ENTERPRISE (Jhoston Garantia)',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    description: 'Perícia do monólito de quartzo, scanner de plaqueta CNC laser, verificação de cura (28d) e garantia decenal.',
  },
];

