# Manual Operacional do Usuário Master (Soberano)
**JHoston Pools Control System (JHPCS)**
*Documento de Governança Estratégica, Segurança e Auditoria Global*

---

## 1. Perfil e Responsabilidades do Master
O perfil **MASTER** detém a autoridade máxima do sistema JHPCS, reservado aos fundadores e gestores supremos da plataforma (**Daniel Souto Lopes** e **Patrícia Souto Lopes**). 

Suas responsabilidades englobam:
- **Governança de Acessos e Usuários**: Aprovação final de novos cadastros de Diretores, Técnicos e Clientes Corporativos.
- **Auditoria de Integridade**: Monitoramento das travas antifraude de fotos e registros com geolocalização por satélite (GPS).
- **Controle de Telecomunicações**: Supervisão das instâncias da **Evolution API (WhatsApp)** e garantia do SLA de resposta (< 3.2 segundos).
- **Gestão de Garantias e Red Zones**: Arbitragem de disputas técnicas e auditoria dos laudos periciais de perda de garantia de revestimentos monolíticos JHostonTec.

---

## 2. Como Acessar o Sistema

### 2.1. Endereço de Acesso
- **Ambiente Web / Nuvem**: Acesse o link oficial do sistema através de qualquer navegador moderno (Chrome, Edge, Safari, Firefox):
  `https://jcs-pools.vercel.app` (ou `http://localhost:3000` em ambiente local).

### 2.2. Credenciais de Acesso
1. Na tela inicial, clique no botão **"Entrar / Cadastrar"** no topo superior direito da barra de comando.
2. Insira suas credenciais corporativas:
   - **E-mail**: `danielsoutolopes@gmail.com` (ou `patriciasoutolopes@gmail.com`)
   - **Senha**: Sua senha mestra definida.
3. Clique em **"Entrar no Sistema"**.
4. O sistema identificará automaticamente seu nível de acesso hierárquico e carregará a interface dourada do **Painel MASTER**.

---

## 3. Navegação e Módulos Exclusivos do Master

### 3.1. Hub de Governança Master (`Painel MASTER`)
Localizado na primeira aba da barra de navegação, este painel reúne:
- **Resumo Executivo do Ecossistema**: Quantidade total de piscinas monitoradas, ativos em risco químico imediato (Red Zones), obras em período crítico de cura e tempo médio de entrega dos alertas WhatsApp.
- **Fila de Aprovação de Novos Usuários**: Visualização de cadastros pendentes com opção de aprovação ou recusa com um clique.
- **Painel de Acesso Rápido**: Atalhos para cadastro de novas piscinas com geocodificação automática via CEP/GPS, gestão de usuários e motor químico.

### 3.2. Dashboard JHostonTec & Cards de Métricas Interativos
No painel principal de comando, o Master pode auditar os 4 grandes pilares do sistema clicando diretamente nos cards de métricas:
1. **Ativos Monitorados**: Abre o resumo consolidado de todos os parques aquáticos. Permite buscar por nome/cidade e clicar em **"Ver Prontuário"** para inspecionar histórico, gráficos de dispersão química e dados contratuais.
2. **Red Zones Ativas**: Filtra imediatamente os tanques que sofreram agressão química (ex.: pH < 7.0 em revestimento novo).
3. **Em Período de Cura**: Acompanha o cronômetro dia a dia das obras em **Cura Seca (7 dias)** e **Cura Submersa (28 dias)** com laudos e bloqueios preventivos.
4. **SLA WhatsApp Evolution**: Aponta a saúde da conexão com a instância da Evolution API, latência de entrega e status do webhook na Vercel/Render.

### 3.3. Gestão Central de Usuários & Matriz RBAC
- **Aba "Gestão de Usuários"**: Permite criar, editar, resetar senhas ou revogar credenciais de qualquer operador em 3 níveis hierárquicos:
  1. *Nível 1 - Master*
  2. *Nível 2 - JHoston Pools (Diretoria e Corpo Técnico)*
  3. *Nível 3 - Cliente Final (Gerente do Resort, Técnico Local e Tratadores)*
- **Aba "Hierarquia (RBAC)"**: Matriz de visualização em tempo real das permissões de leitura, escrita e auditoria para cada perfil.

### 3.4. Módulo Clientes & Telemetria Fórmula 1 ("Pit Wall")
Acessível pela aba **"Clientes & Telemetria F1"**:
- **Seletor de Clientes Soberano**: Permite ao Master alternar instantaneamente entre qualquer cliente cadastrado no país (ex.: Resort Terravista, Fasano, Copacabana Palace).
- **Inspeção de Saúde do Ativo**: Health Score (0 a 100%), volume total monitorado e status contratual do revestimento.
- **Cockpit F1 de Telemetria Contínua**:
  - Tacômetros digitais ao vivo com faixas de tolerância estrita de engenharia.
  - Medidor de Equilíbrio Langelier (LSI Dial) com apontamento em tempo real de tendências corrosivas ou incrustantes.
  - Gráficos de séries históricas de medições físicas e químicas integrados à previsão do tempo (OpenWeather).
  - Prescrição instantânea de Pit Stop Químico com dosagem estequiométrica em gramas e kg.

### 3.5. Motor Químico & Regras JHostonTec
- Visualização das constantes químicas adotadas pelo sistema:
  - Faixa ideal de pH: **7.2 a 7.6** (Alerta em 7.0 / Red Zone em < 6.8 ou > 8.0)
  - Cloro Livre: **1.5 a 3.0 ppm**
  - Alcalinidade Total: **80 a 120 ppm**
  - Dureza Cálcica: **200 a 400 ppm**
- Regra de Cura Submersa: Bloqueio estrito de aplicação de ácido clorídrico (muriático) e cloração de choque nas primeiras 4 semanas de preenchimento da piscina.

## 3.6. A Software House GADAP Sistemas & Engenharia de Confiança
A infraestrutura do JHPCS foi arquitetada e desenvolvida com exclusividade pela **GADAP Sistemas (Inovação e Flexibilidade)** sob a liderança técnica de **Daniel Lopes & Patrícia Grübel**.
O nome GADAP sintetiza três raízes milenares fundamentais:
1. **A Raiz "ADAP" (Latim / Inglês)**: *Adaptare* / *Adapt* — Inovação e flexibilidade contínua. Um sistema rígido gera medo e frustração; um sistema adaptável é amigável e focado no usuário. Foneticamente soa como **G-ADAP** (*Global Adaptation* ou *Great Adaptation*).
2. **O Conceito "Adab" (Árabe / Turco)**: Ética, respeito, boas maneiras e conduta moral irrepreensível, estabelecendo relações de clareza e confiança inabalável com clientes e diretores.
3. **A Palavra "Gada" (Sânscrito)**: A clava sagrada, símbolo ancestral de força absoluta, autoridade invicta e fundações inabaláveis, materializada no guardião oficial da plataforma: o **Bulldog Cibernético**.

### 3.7. Relatórios Executivos & Envio de Documento PDF via Evolution API
- **Disparo Direto de Arquivo PDF (Nativo)**: Através da integração oficial com a Evolution API (`instância: ecostone`), o Master pode enviar o arquivo PDF real da **Revista Executiva Colecionável (Compêndio)** e da **Revista do Proprietário** diretamente no WhatsApp dos diretores ou clientes (sem forçar abertura de links externos).
- **Planos Comerciais de Despacho & Vencimento Antecipado**:
  - *Standard Incluso (Gratuito)*: 1 envio mensal no 1º dia útil.
  - *Pro Executive (R$ 29,90/mês)*: Envios quinzenais (dias 01 e 15) com telemetria F1 e balanço LSI.
  - *Black Elite / Resort (R$ 49,90/mês)*: Envios semanais toda segunda-feira às 08h, radar meteorológico e laudo com Hash SHA-256.
  - *Condição de Pagamento*: Quitação antecipada até o **dia 05 do mês corrente**.
  - *Degustação & Extensão Técnica*: 6 meses iniciais gratuitos de envios frequentes. Prorrogação de até mais 3 meses permitida mediante laudo pericial da equipe técnica e autorização mandatória da Diretoria da JHoston Pools.

---

## 4. Procedimentos de Emergência e Boas Práticas
1. **Quando uma Red Zone é disparada**:
   - Inspecione a notificação automática no WhatsApp ou abra o card "Red Zones Ativas".
   - Acesse o prontuário da piscina e verifique a foto do teste da fita/reagente e as coordenadas de GPS do tratador.
   - Entre em contato com o corpo técnico da JHoston Pools para orientar a dosagem corretiva antes que ocorra descoloração ou ataque ao monólito.
2. **Aprovação de Novos Colaboradores**:
   - Nunca aprove um usuário com cargo de Técnico ou Diretor sem validação prévia de CPF e vínculo com a empresa.
3. **Segurança de Acesso**:
   - Mantenha a autenticação por senha forte (letras, números e caracteres especiais) e utilize o botão de logout ao sair de computadores compartilhados.

---
*GADAP Sistemas • Criadora Oficial do JHoston Pools Control System (JHPCS)*  
*Garantia de Revestimentos Monolíticos, Telemetria F1 & Digital Twin*
