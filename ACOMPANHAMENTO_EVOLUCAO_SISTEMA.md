# 🚀 Acompanhamento de Evolução do Sistema (JHPCS-CAMPO)
**JHoston Pools Control System • Módulo de Campo PWA**  
*Registro contínuo de atualizações, versões, decisões arquiteturais e homologações de engenharia.*

---

## 📌 Sumário de Versões

| Versão | Data | Status | Descrição Sumária |
| :--- | :--- | :--- | :--- |
| **v4.4.0** | 11/11/2026 | **Produção / Homologado** | Leitura Colorimétrica de Tubos de Ensaio (Estojo Comparador Líquido de Cloro/pH) 100% Offline |
| **v4.3.0** | 11/11/2026 | **Homologado** | Visão Computacional no Edge: Inspeção de microfissuras e descontinuidade de rejuntes via Sobel 3x3 local |
| **v4.2.0** | 11/11/2026 | **Homologado** | Visão Computacional Embarcada (Edge Canvas Colorimetry): Leitura contínua de fitas 100% offline em subsolos |
| **v4.1.0** | 11/11/2026 | **Homologado** | Central de Relatórios & Fechamento Mensal no PWA: Dossiê WhatsApp, Lista de Químicos e Livro Sanitário Anvisa |
| **v4.0.0** | 11/11/2026 | **Homologado** | Arquitetura Polimórfica e Modular por Perfil (SOLO, FLEET, FACILITY, ENTERPRISE JHOSTON), ISL local e Contas Demo |
| **v3.1.0** | 11/11/2026 | **Homologado** | Cockpit do Tratador: Roteiro por proximidade Haversine, saldo móvel da caminhonete e badges de status de visita |
| **v3.0.0** | 10/11/2026 | **Homologado** | Emissor de Cupom Fiscal e Recibo de Atendimento com Contingência Offline Sefaz |
| **v2.2.0** | 10/11/2026 | **Homologado** | Biometria WebAuthn (Touch/Face ID), Notificações WebPush FCM e Scanner NFC/QR de Casa de Máquinas |
| **v2.1.0** | 10/11/2026 | **Homologado** | Trava rígida de Geofencing Haversine (50m), justificação formal e Assinatura Digital Touch em Canvas |
| **v2.0.0** | 10/11/2026 | **Homologado** | Cloudflare R2 (egress zero), Multi-substrato, Baixa de estoque da caminhonete, White-Label e WebP client-side |
| **v1.1.0** | 06/11/2026 | **Homologado** | Central de Ajuda interativa in-app (`/ajuda`), guia de instalação PWA e ativação de primeiro acesso com PIN |
| **v1.0.0** | 06/11/2026 | **Homologado** | Setup inicial PWA Next.js 16/React 19, Wizard de manutenção, IndexedDB v1 offline, câmera com GPS |

---

## 🔍 Detalhamento dos Ciclos de Evolução

### [v4.4.0] — 11/11/2026 • Leitura Colorimétrica de Tubos de Ensaio (Estojo Comparador Líquido)
> **Objetivo:** Estender a visão computacional local para suportar estojos de teste tradicionais por tubos de ensaio cilíndricos com reagente líquido (Vermelho de Fenol e Ortotolidina/DPD líquido), muito comuns no dia a dia dos tratadores.

#### 1. Calibração Espectral Específica para Líquidos em Tubos (`src/lib/vision/colorimetryEngine.ts`)
- **Escala de pH Líquido (Vermelho de Fenol)**:
  * Faixa de 6.8 (Amarelo brilhante) a 8.2 (Vermelho magenta/púrpura), considerando a refração e densidade volumétrica da coluna d'água cilíndrica.
- **Escala de Cloro Líquido (Ortotolidina / DPD Amarelo)**:
  * Faixa de 0.0 ppm (Incolor) a 5.0 ppm (Âmbar/Marrom dourado escuro).
- **Amostragem Cilíndrica com Rejeição de Reflexos do Vidro/Acrílico**:
  * Região de interesse vertical ampliada (40x80 px por tubo) filtrando o brilho especular das paredes transparentes da cubeta.

#### 2. Visor HUD com Alternância de Alvo (`src/components/AiStripScannerModal.tsx`)
- Seletor rápido de alvo no cabeçalho:
  * **🧪 Fita Reagente 4-em-1**: Retículo vertical para 3 almofadas (Cl, pH, Alk).
  * **⚗️ Tubos de Ensaio (Estojo)**: Retículo horizontal duplo com dois compartimentos transparentes destacados (Tubo Esquerdo: Cloro / Tubo Direito: pH).
- Amostragem instantânea em tempo real e preenchimento com 1 toque no formulário de atendimento ativo.

---

### [v4.3.0] — 11/11/2026 • Visão Computacional no Edge (Detecção de Microfissuras & Rejuntes)
> **Objetivo:** Eliminar a dependência de APIs remotas para inspeção de superfícies, executando a análise pericial de trincas, rejuntes e eflorescência diretamente no dispositivo móvel do técnico.

#### 1. Motor de Detecção Estrutural no Edge (`src/lib/vision/edgeSurfaceInspector.ts`)
- **Convolução de Gradiente Sobel 3x3**:
  * Executa operadores de gradiente $G_x$ e $G_y$ sobre a matriz de luminância para calcular a magnitude de bordas finas anômalas.
  * Identifica descontinuidades mecânicas, trincas estruturais e destacamento de pastilhas.
- **Detecção Espectral de Eflorescência Cálcica**:
  * Amostra a dispersão de pixels esbranquiçados de alto brilho e baixo contraste cromático indicativos de lixiviação de carbonato de cálcio.
- **Geração de Máscara de Realce Visual (Overlay)**:
  * Desenha sobre a fotografia original um overlay ciano neon destacando os caminhos de trinca para validação visual imediata pelo tratador.

#### 2. Modal de Inspeção Polimórfico (`src/components/SurfaceAiInspectorModal.tsx`)
- Seletor de modo com suporte duplo:
  * **Edge Local (100% Offline)**: Processamento instantâneo via hardware local (Canvas/WASM/GPU).
  * **Nuvem Remota (Gemini Multimodal)**: Fallback quando houver conexão 4G/Wi-Fi disponível.
- Parecer pericial automático com prescrição de reparo e vinculação direta ao prontuário da piscina.

---

### [v4.2.0] — 11/11/2026 • Visão Computacional Embarcada (Edge Canvas Colorimetry)
> **Objetivo:** Permitir ao tratador apontar a câmera do celular para a fita reagente ou cubeta e extrair automaticamente os valores de Cloro Livre, pH e Alcalinidade diretamente no hardware local, mesmo 100% offline em subsolos ou casas de máquinas blindadas.

#### 1. Motor Espectral em Canvas Local (`src/lib/vision/colorimetryEngine.ts`)
- **Amostragem em Tempo Real sem Dependência de Nuvem**:
  * Captura os frames do feed de vídeo da câmera (`navigator.mediaDevices.getUserMedia`) renderizados em um Canvas oculto de alta performance (`willReadFrequently: true`).
  * Converte os pixels para o espaço RGB/HSV com cálculo de distância colorimétrica perceptiva (*Red-mean euclidiana* ponderada).
- **Escalas Espectrais Calibradas**:
  * Escala de Cloro DPD (0.0 a 5.0 ppm).
  * Escala de pH Fenol Vermelho (6.8 a 8.4).
  * Escala de Alcalinidade Total (40 a 240 ppm).
- **Filtro de Ruído & Rejeição Especular**:
  * Descarta reflexos solares saturados e sombras escuras para manter a confiança analítica acima de 95%.

#### 2. Visor HUD com Congelamento de Frame (`src/components/AiStripScannerModal.tsx`)
- Retículo visual que orienta o tratador a centralizar as 3 almofadas (pads) da fita reagente na tela.
- Amostragem contínua a cada ~150ms com baixo consumo de bateria.
- Botão **"Capturar & Congelar Leitura"** com opção de retomar ao vivo ou aplicar instantaneamente os dados extraídos nos formulários de visita.
- Presets de calibração rápida para validação de bancada.

---

### [v4.1.0] — 11/11/2026 • Central de Relatórios & Fechamento Mensal no PWA
> **Objetivo:** Permitir ao tratador/técnico gerar e compartilhar diretamente da borda da piscina relatórios de última visita, dossiês de fechamento mensal com chave PIX e exportação do livro sanitário NBR 10.818 da ANVISA.

#### 1. Drawer da Central de Relatórios (`src/components/reports/PoolReportsDrawer.tsx`)
- Acessível com 1 toque no botão **"Relatórios"** presente no card de cada piscina na rota diária do Cockpit.
- **Botão 1 (Última Visita)**: Mensagem técnica formatada para WhatsApp com parâmetros (pH, Cloro, Alcalinidade, ISL), serviços executados e chancela JHPCS.
- **Botão 2 (Fechamento Mensal - Planos SOLO e FLEET)**:
  * Seletor de Mês/Ano com consolidação de visitas e dosagens via `/api/reports/monthly`.
  * Exibição de média de pH, estabilidade química e link público do relatório digital com fotos.
  * Inclusão opcional de valor da mensalidade e **Chave PIX do tratador** com botão de cópia rápida.
- **Botão 3 (Livro Sanitário ANVISA - Plano FACILITY)**:
  * Exportação oficial em PDF consolidando os 3 turnos diários conforme a norma NBR 10.818.
- **Modo ENTERPRISE (Jhoston Pools)**:
  * Emissão do Certificado Pericial Decenal com histórico de conformidade química da matriz de quartzo.

#### 2. Gerador de Lista de Reposição de Químicos
- Dentro do Fechamento Mensal, o tratador tem o botão **"Copiar P/ Cliente"**, que gera uma lista pronta de compras com os insumos consumidos e sugeridos para reposição, destacando itens urgentes.

#### 3. Tratamento Resiliente de Falhas de Rede (Offline)
- Ao abrir a central sem conexão na casa de máquinas, o PWA apresenta um aviso suave: *"Conecte-se à internet para consolidar o PDF e o Dossiê Mensal com as fotos da nuvem"*, mantendo o envio de comprovante da última visita via dados locais.

---

### [v4.0.0] — 11/11/2026 • Arquitetura Polimórfica Modular por Perfil Operacional
> **Objetivo:** Separar as experiências dos públicos que utilizam o PWA de campo (tratadores autônomos, frotas de manutenção, hotéis/condomínios e garantia Jhoston Pools), garantindo regras, travas e formulários específicos para cada modelo de negócio.

#### 1. Modo SOLO (`AUTONOMO` - Tratador Individual) (`src/components/profiles/SoloMaintenanceForm.tsx`)
- Interface limpa e ultrarrápida com foco na rota do dia.
- Sem bloqueio rígido de GPS (apenas captura coordenada informativa).
- Sem exigência de estoque ou inventário de viatura.
- **Botão de Destaque "Enviar Comprovante no WhatsApp"**: Gera relatório com identidade White-Label configurada (Nome Comercial e WhatsApp do próprio tratador), sem menções a garantias industriais de terceiros.

#### 2. Modo FLEET (`FROTA` - Empresa de Manutenção) (`src/components/profiles/FleetMaintenanceForm.tsx`)
- **Trava Rígida de Geofencing GPS (50 Metros)**: Calcula a distância Haversine em tempo real. Bloqueia o check-in se distância > 50m da borda, exigindo justificativa pericial formal.
- **Baixa Estequiométrica de Estoque Volante**: Exibe o saldo da caminhonete e debita quilos/litros consumidos no payload do Core (`/api/v1/maintenance/submit`).
- **Assinatura Digital Touch**: Coleta formal da assinatura do cliente/encarregado na tela do celular.

#### 3. Modo FACILITY (`HOTEL_CLUBE` - Hotel, Resort e Condomínio) (`src/components/profiles/FacilityMaintenanceForm.tsx`)
- Foco exclusivo nos complexos aquáticos do empreendimento (sem clientes residenciais).
- **Formulário Sanitário ANVISA / NBR 10.818**:
  * Seletor obrigatório de Turno (`[MANHÃ | TARDE | NOITE]`).
  * Campos específicos: Cloro Livre (1.0-3.0 ppm), Cloro Combinado (<=0.4 ppm), pH, Temperatura (°C), Transparência da Água, Estimativa de Banhistas, Limpeza de Pré-filtros e Pressão do Filtro (PSI).
  * Alerta Crítico: Banner vermelho em destaque caso o Cloro Livre fique fora da faixa sanitária (1.0 a 3.0 ppm).

#### 4. Modo ENTERPRISE (`FABRICANTE` - Auditoria & Garantia Decenal Jhoston) (`src/components/profiles/EnterpriseMaintenanceForm.tsx`)
- Leitor óptico/NFC de Plaqueta Metálica Laser CNC da casa de máquinas.
- Verificação automática do status da obra: "Período de Cura Química (28 dias)" vs. "Garantia Decenal Ativa".
- Formulário pericial com foco na integridade do monólito de areia de quartzo e bloqueio de ácido muriático direto.

#### 5. Seletor de Contas Demo Instantâneo (1-Click Switcher)
- Tela de login com chaveamento instantâneo entre as 4 contas de demonstração:
  * `teste.solo@teste.com` (Modo Solo)
  * `teste.frota@teste.com` (Modo Fleet)
  * `teste.facility@teste.com` (Modo Facility)
  * `teste.jhoston@teste.com` (Modo Enterprise Jhoston)

---

### [v3.1.0] — 11/11/2026 • Cockpit do Tratador & Roteirização Inteligente
> **Objetivo:** Otimizar o tempo de deslocamento do tratador, priorizando piscinas mais próximas geograficamente e monitorando insumos da caminhonete em tempo real.

#### 1. Roteiro Dinâmico por Proximidade Haversine (`src/components/TechnicianCockpit.tsx`)
- Ordenação matemática em tempo real das piscinas agendadas a partir das coordenadas GPS do aparelho móvel do técnico.
- Tag visual destacando a piscina mais próxima para atendimento imediato.
- Filtro rápido por status: Pendentes ⏳, Concluídas ✅, Em Risco 🚨 e busca textual por nome de hotel/condomínio.
- Botão direto para iniciar o atendimento ou revisar laudos já concluídos.

#### 2. Saldo Atual da Caminhonete (Estoque Móvel)
- Painel em tempo real com os saldos físicos restantes no veículo (Dicloro, Barrilha, Bicarbonato, Algicida).
- Destaque em vermelho quando o saldo de um insumo atinge nível crítico de reposição.
- Abatimento automático sincronizado com a baixa estequiométrica do formulário de visita.

### [v3.0.0] — 10/11/2026 • Módulo Fiscal Autônomo e Recibo de Campo
> **Objetivo:** Emissão instantânea de cupom fiscal e prestação de contas dos serviços e insumos químicos direto no celular do técnico.

#### 1. Emissor de Cupom Fiscal de Atendimento (`src/components/OfflineReceiptModal.tsx`)
- Geração de recibo fiscal no padrão de impressora térmica ou compartilhamento digital.
- Totalização automática de mão de obra e insumos químicos reais consumidos com NCM, CFOP 5102 e cálculo estequiométrico.
- Emissão em **Contingência Offline Sefaz** com chave digital gerada em tempo real para regularização fiscal.
- Compartilhamento no WhatsApp com 1 toque e botão nativo de impressão direta para miniprinter Bluetooth.

### [v2.2.0] — 10/11/2026 • Biometria WebAuthn, Notificações Push & Scanner NFC
> **Objetivo:** Velocidade extrema de login e check-in físico de alta tecnologia em casas de máquinas.

#### 1. Autenticação Biométrica WebAuthn (`src/lib/auth/webauthn.ts`)
- Suporte nativo à API WebAuthn do navegador móvel (Touch ID, Face ID, leitor de digitais Android e Windows Hello).
- Login em 1 segundo sem necessidade de digitar PIN repetidamente sob o sol.
- Associação local com a chave criptográfica vinculada ao CPF do técnico.

#### 2. Notificações WebPush em Segundo Plano (`public/firebase-messaging-sw.js` & `src/lib/firebase.ts`)
- Service worker com suporte a `onBackgroundMessage` e `notificationclick`.
- Botão tátil no cabeçalho do PWA para ativar alertas de roteiro e contingência química imediata.

#### 3. Check-in de Casa de Máquinas por NFC e QR Code (`src/components/MachineRoomScannerModal.tsx`)
- Suporte à Web NFC API (`NDEFReader`) para leitura por aproximação de tags metálicas fixadas no quadro elétrico.
- Leitor óptico de QR Code e validação manual por código de patrimônio.
- Seleção e travamento automático da piscina ao encostar o telefone no quadro.

### [v2.1.0] — 10/11/2026 • Geofencing Haversine 50m & Assinatura Digital Touch
> **Objetivo:** Blindagem pericial para a Garantia Decenal com bloqueio de lançamento fora do raio da piscina e coleta de assinatura do cliente na tela.

#### 1. Trava Pericial de Geofencing Haversine 50m (`src/lib/geo/geofencing.ts`)
- **Implementação:**
  - Utilitário matemático com a fórmula de Haversine para cálculo de distância esférica exata em metros.
  - Leitura contínua de GPS de alta precisão via `navigator.geolocation` (`enableHighAccuracy: true`, `maximumAge: 0`).
  - **Bloqueio Inviolável:** Se o tratador estiver a mais de 50 metros da coordenada cadastrada da piscina:
    - O botão de transmissão é travado com badge vermelho de alerta de divergência;
    - Exige justificativa formal pericial escrita (mínimo de 5 caracteres);
    - Registra a flag `geofence_flag: true`, `geofence_distance_m` e `geofence_justification` no payload e na auditoria.

#### 2. Assinatura Digital Touch do Cliente (`src/components/CanvasSignatureModal.tsx`)
- **Implementação:**
  - Subcomponente tátil responsivo em Canvas HTML5 (suporte a mouse, dedo e stylus em tela touch).
  - Coleta opcional do nome do responsável e assinatura vetorial compactada para WebP leve (~8 KB).
  - Exportação direta no payload e no recibo compartilhado pelo WhatsApp com o nome do signatário.

### [v2.0.0] — 10/11/2026 • Expansão Multi-Substrato & Cloudflare R2
> **Objetivo:** Adequação ao ecossistema central v6.0 da JHoston Pools com eliminação de custos de egress de mídia e suporte comercial universal.

#### 1. Integração com Cloudflare R2 (Armazenamento de Mídia)
- **Motivação:** Redução drástica de custos com tráfego e armazenamento do Supabase Storage.
- **Implementação:**
  - Instalação do SDK `@aws-sdk/client-s3` conectado ao endpoint Cloudflare R2 (`jhpcs-fotos-inspecoes`).
  - Criação da biblioteca `src/lib/r2.ts` com upload direto e fallback automático para o Supabase Storage em caso de instabilidade.
  - Otimização do endpoint `/api/storage/upload-evidence`.
  - Compressão de imagens em hardware local (Canvas HTML5) via `src/lib/image-compressor.ts` convertendo para WebP (máx. 1280x720, qualidade 0.75) antes da transmissão, reduzindo arquivos de 4-8 MB para ~40-70 KB.

#### 2. Seletor de Substratos Multi-Material
- **Motivação:** Cobertura de mercado para além das piscinas de areia compactada, atendendo fibra, vinil e alvenaria.
- **Implementação:**
  - Inclusão do módulo de regras físico-químicas `src/lib/substrate-rules.ts`.
  - Suporte a 5 tipos: `MONOLITICO_SAND`, `FIBRA_VIDRO`, `VINIL`, `PASTILHA_CERAMICA`, `ALVENARIA_PINTADA`.
  - Badges e alertas dinâmicos no wizard:
    - Vinil: Bloqueio contra cloro granulado puro direto no fundo;
    - Fibra: Alerta de dureza cálcica mínima (180 ppm) contra branqueamento de gelcoat;
    - Pastilha: Alerta de dissolução ácida de rejunte;
    - Monolítico: Tolerância zero a ácidos muriáticos/limpa pedras.

#### 3. Baixa Automática de Insumos da Caminhonete
- **Motivação:** Controle de estoque físico do tratador e apuração estequiométrica em tempo real.
- **Implementação:**
  - Acoplamento do catálogo fiscal `src/lib/fiscal/offlineFiscalCatalog.ts` (NCM, CFOP, alíquotas).
  - Adição de seletor rápido no wizard para lançamento dos produtos químicos aplicados no atendimento (ex.: Dicloro, Barrilha, Bicarbonato).
  - Envio do array `productsApplied` no payload para o Core debitar automaticamente o estoque do técnico.

#### 4. Identidade Comercial White-Label
- **Motivação:** Permitir que tratadores terceirizados e parceiros utilizem o app valorizando sua própria marca perante o cliente final.
- **Implementação:**
  - Modal de configurações no PWA para salvar "Nome Comercial / Apelido" e "WhatsApp de Atendimento".
  - Persistência híbrida no IndexedDB (`technician_profile`) e `localStorage`.
  - Disparo de comprovante de visita no WhatsApp com 1 toque:
    `🌊 Relatório de Manutenção - [Marca do Tratador] • Sua piscina está 100% pronta para banho! • Auditoria Técnica JHPCS Engine`.

---

### [v1.1.0] — 06/11/2026 • Suporte e Ajuda ao Usuário
- Criação da página móvel `/ajuda` com categorias filtráveis (Rotina Diária, Sem Internet, Fotos & GPS, Instalação PWA, IA).
- Botão rápido de navegação no cabeçalho e rodapé do PWA.
- Implementação da rota de ativação `/api/auth/complete-profile` e `/primeiro-acesso`.
- Service Worker atualizado com cache de contingência para as telas de documentação.

---

### [v1.0.0] — 06/11/2026 • MVP de Campo Isolado
- Inicialização do repositório `jhpcs-campo` desmembrado da aplicação desktop principal.
- Configuração do Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS e TypeScript.
- Desenvolvimento do `MaintainerPwaWizard.tsx` com geolocalização e captura nativa de câmera.
- Criação do banco offline local no IndexedDB via biblioteca `idb`.

