# 📘 Manual de Operação e Guia Oficial do Usuário
**JHPCS Campo • Aplicativo PWA Offline-First Multi-Setor**  
*Versão v4.5.0 • Arquitetura Polimórfica, Visão Computacional no Edge, Alertas Meteorológicos e Central de Relatórios*

---

## 1. Visão Geral do Sistema
O **JHPCS Campo** é o aplicativo de operação móvel do ecossistema JHoston Pools Control System. Desenvolvido sob a arquitetura **Offline-First (IndexedDB)**, ele foi projetado especificamente para atender quatro realidades operacionais distintas através de uma interface polimórfica:

1. **Modo Solo (`AUTONOMO`)**: Para tratadores autônomos e pequenos prestadores de serviços, focado em agilidade, rotas rápidas, envio de laudos com identidade comercial própria (*White-Label*) e fechamento mensal com chave PIX via WhatsApp.
2. **Modo Fleet (`FROTA`)**: Para empresas com equipes de manutenção móvel, com cerca eletrônica obrigatória (**Trava de Geofencing 50m** via fórmula de Haversine), baixa estequiométrica em tempo real do estoque volante da caminhonete e coleta de assinatura digital do cliente na tela do celular.
3. **Modo Facility (`HOTEL_CLUBE`)**: Para operadores de condomínios, resorts, hotéis e clubes esportivos, estruturado em conformidade com as exigências sanitárias da **ANVISA e ABNT NBR 10.818**, com seletor de turno obrigatório (*Manhã, Tarde, Noite*) e emissão do Livro Sanitário Consolidado.
4. **Modo Enterprise (`FABRICANTE`)**: Para peritos e auditores da JHoston Pools & Lagoons, com leitor de plaqueta CNC laser via QR Code / NFC na casa de máquinas, monitoramento de período de cura (28 dias) e garantia decenal do revestimento monolítico de areia compactada.

---

## 2. Instalação do Aplicativo (PWA Nativo sem Lojas)

O JHPCS Campo não exige download na Google Play Store nem na Apple App Store. Ele é instalado diretamente pelo navegador:

### No Celular Android (Google Chrome):
1. Acesse a URL do aplicativo no navegador.
2. Toque no botão **"Instalar App"** no topo ou no banner de rodapé.
3. Caso não apareça, toque no menu de opções `⋮` no canto superior direito e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. O ícone oficial será criado na tela inicial, rodando em modo tela cheia (*standalone*) com armazenamento local persistente.

### No Celular iPhone (Apple Safari):
1. Abra o link no Safari.
2. Toque no botão de Compartilhamento (ícone quadrado com seta para cima `⬆`).
3. Role as opções até encontrar **"Adicionar à Tela de Início"**.
4. Toque em **"Adicionar"** no canto superior direito.

---

## 3. Autenticação Polimórfica & Contas Demo

O sistema adapta instantaneamente sua interface e regras conforme o perfil do usuário autenticado:

### Acesso Rápido por Contas de Demonstração (1 Toque)
Para testes e treinamentos em campo, utilize a aba **"Contas Demo"**:
- **Tratador Autônomo (Solo)**: Carlos Tratador (`carlos.solo@jcs-pools.com`).
- **Técnico Frota (Fleet)**: Rodrigo Frota (`rodrigo.frota@jcs-pools.com`).
- **Operador Hotel (Facility)**: Marcos Facility (`marcos.resort@jcs-pools.com`).
- **Auditor JHoston (Enterprise)**: Eng. Amanda Jhoston (`amanda.pericia@jcs-pools.com`).

### Acesso Profissional por CPF & PIN / Biometria
- **CPF & PIN**: Digite o CPF cadastrado e o PIN numérico de 4 dígitos.
- **Biometria WebAuthn**: Caso seu dispositivo possua leitor biométrico (impressão digital ou Face ID), utilize o botão **"Entrar com Biometria"** para login instantâneo mesmo sem conexão à internet.

---

## 4. O Cockpit do Tratador (Roteiro Inteligente)

Ao autenticar, a tela inicial exibe o **Cockpit Diário**:
- **Ordenação por Proximidade GPS (Haversine)**: As piscinas do seu roteiro são reordenadas automaticamente da mais próxima para a mais distante da sua localização física.
- **Card de Destaque da Próxima Parada**: Exibe a distância exata em metros/quilômetros, tempo estimado de deslocamento e atalho direto para iniciar a vistoria.
- **Badges de Status de Visita**:
  - `✅ Realizada`: Piscina vistoriada hoje.
  - `⚠️ Alerta`: ISL fora dos parâmetros ideais ou pendência de manutenção.
  - `⏳ Pendente`: Piscina aguardando atendimento.
- **Indicador de Sinal e Fila de Sincronização**: Mostra se você está online ou offline e a quantidade de laudos retidos no IndexedDB aguardando transmissão.
- **Botão "Sincronizar Rota"**: Executa a rotina matinal completa, transmitindo laudos pendentes e descarregando os alertas meteorológicos de 48h gerados pelo Core.

---

## 5. Alertas Meteorológicos Preditivos (Janela 48h)

O PWA consome os alertas preditivos gerados pelo Core v6.0 (`GET /api/v1/pwa/weather-alerts`), salvando-os no IndexedDB para operação 100% offline. **O aplicativo nunca consome APIs meteorológicas externas diretamente.**

### Badges no Card da Rota:
1. `⛈️ Alerta Chuva Ácida (48h)` (Âmbar/Laranja): Indica tempestade iminente e risco de queda brusca de pH/Alcalinidade.
2. `🦠 Risco de Algas / Calor (48h)` (Verde-Limão): Onda de calor e radiação UV intensa com risco acelerado de proliferação de algas.
3. `🛡️ Proteção de Cura Jhoston` (Vermelho Crítico): Piscina em período de cura (28 dias) com previsão de precipitação torrencial.

### Banner de Dosagem Estequiométrica nos Formulários:
- Ao abrir uma piscina alertada, um banner técnico no topo exibe a instrução estequiométrica exata calculada pelo Core (ex: *"Aplicar +900g de Bicarbonato de Sódio preventivamente antes da tempestade"*).
- Checkbox tátil para operação com uma mão: `[x] Aplicação preventiva climática realizada`.
- **Baixa Automática no Estoque da Caminhonete (Modo Fleet)**: Ao marcar a aplicação preventiva, o produto químico sugerido é automaticamente somado à relação de produtos consumidos (`productsApplied`), debitando o estoque volante sem necessidade de digitação repetitiva.
- Ao finalizar a visita, o `acknowledgedAlertId` é enviado para dar baixa oficial no alerta no Core e no IndexedDB local.

---

## 6. Visão Computacional no Edge (100% Offline)

O JHPCS Campo possui motores de visão computacional embarcados via HTML5 Canvas, permitindo análises periciais sem conexão com a internet e sem envio de dados para servidores externos:

### 6.1. Leitura de Fitas Analíticas & Tubos de Ensaio (`AiStripScannerModal`)
- **Seletor de Modo**:
  * **🧪 Fita 4-em-1**: Retículo vertical guiando a captura simultânea de Cloro, pH e Alcalinidade.
  * **⚗️ Tubos de Ensaio (Estojo Comparador Líquido)**: Retículo horizontal duplo com compartimentos transparentes destacados para medição de **Cloro (Ortotolidina/DPD)** no tubo esquerdo e **pH (Vermelho de Fenol)** no tubo direito.
- **Processamento Espectral HSV**: Analisa a densidade óptica e o matiz da água reagida, rejeitando reflexos de vidro/acrílico.
- **Preenchimento Automático**: Toque em *"Aplicar Valores"* para transferir as leituras diretamente para os campos do laudo.

### 6.2. Inspeção Estrutural de Rejuntes & Microfissuras
- Aplica convolução de gradiente **Sobel 3x3** em tempo real sobre a imagem do substrato.
- Detecta eflorescência cálcica (lixiviação de carbonato) e descontinuidades de rejunte ou trincas estruturais.
- Gera máscara visual com realce ciano neon na foto para auditoria técnica.

---

## 7. Motor Químico ISL Multissubstrato

Em todos os modos, o aplicativo reconhece o substrato da piscina e calcula localmente o **Índice de Saturação de Langelier (ISL)**:
$$\text{ISL} = \text{pH} + \text{TF} + \text{CF} + \text{AF} - 12.1$$

### Regras por Substrato:
- **Monolítico Areia (JHostonTec)**: Proibido ácido muriático direto ou pastilhas de cloro decantadas no fundo. Manter pH entre 7.2 e 7.6.
- **Fibra de Vidro**: Exige Dureza Cálcica mínima de 200 ppm para evitar osmose e branqueamento do gelcoat.
- **Vinil**: Exige pré-diluição de cloro granulado em balde plástico. Proibido sulfato de cobre.
- **Pastilha Cerâmica**: pH mínimo de 7.4 para evitar corrosão química da junta cimentícia.
- **Alvenaria Pintada**: Proibida escovação com cerdas de aço inox.

### Diagnóstico do ISL:
- **Água Corrosiva ($\text{ISL} < -0.3$)**: Agressiva aos equipamentos e rejuntes; exige elevação de pH ou alcalinidade.
- **Água Equilibrada ($-0.3 \le \text{ISL} \le +0.5$)**: Faixa ideal de preservação e conforto.
- **Água Incrustante ($\text{ISL} > +0.5$)**: Risco de deposição de calcário e turbidez.

---

## 8. Particularidades de Cada Perfil Operacional

### A. Modo Solo (Autônomo)
- **Marca Própria (White-Label)**: Configure o nome fantasia da sua empresa, WhatsApp e chave PIX.
- **Comprovante WhatsApp Instantâneo**: Ao concluir a visita, compartilhe com 1 clique o comprovante formatado com emojis, parâmetros medidos, status do ISL e link das fotos.
- **Sem bloqueios restritivos**: Coleta de GPS informativa, sem travas de geofencing.

### B. Modo Fleet (Frota Comercial)
- **Trava Rígida de Geofencing (50m)**: Se o técnico estiver a mais de 50 metros da borda da piscina cadastrada, o envio é bloqueado, exigindo aproximação física ou preenchimento de justificativa formal de auditoria.
- **Controle de Estoque Volante**: Baixa estequiométrica em tempo real dos insumos da caminhonete com base no catálogo fiscal NCM/CST offline.
- **Assinatura Touch em Canvas**: Coleta de assinatura digital do cliente ou síndico na tela do celular.

### C. Modo Facility (Hotel, Resort & Condomínio)
- **Conformidade NBR 10.818 / ANVISA**:
  * Seletor obrigatório de turno: **Manhã**, **Tarde** ou **Noite**.
  * Medições de Cloro Livre, Cloro Combinado, pH, Temperatura, Transparência, Banhistas e Pressão do Filtro (PSI).
  * Banner vermelho de alerta sanitário imediato caso o Cloro Livre fique fora de $1.0\text{ ppm}$ a $3.0\text{ ppm}$.

### D. Modo Enterprise (Garantia JHoston Pools)
- **Validação de Plaqueta CNC Laser**: Leitura de QR Code/NFC da plaqueta afixada na casa de máquinas.
- **Monitoramento de Período de Cura (28 dias)** vs. **Garantia Decenal Ativa**.
- **Bloqueio de Produtos Proibidos**: Travas rígidas contra aplicação de insumos incompatíveis com o revestimento monolítico.

---

## 9. Central de Relatórios & Fechamento Mensal

Acessível pelo card de cada piscina ou menu principal:
1. **Comprovante da Última Visita (WhatsApp)**: Texto técnico completo com indicadores do atendimento.
2. **Fechamento Mensal com PIX (Solo/Fleet)**:
   - Consolidação de visitas realizadas no mês.
   - Totalização de produtos consumidos.
   - Envio do link público do relatório interativo com cobrança da mensalidade e chave PIX formatada para pagamento imediato.
3. **Lista de Reposição de Produtos**: Relação enxuta para envio ao proprietário que compra os próprios químicos.
4. **Livro Sanitário ANVISA (Exclusivo Facility)**: Exportação do PDF oficial contendo os 3 turnos do mês conforme NBR 10.818.

---

## 10. Resolução de Dúvidas e Problemas Frequentes

| Situação | Causa Provável | Ação Recomendada |
| :--- | :--- | :--- |
| **Aparece "Offline (IndexedDB)"** | Local sem 4G ou Wi-Fi | Trabalhe normalmente. Todos os dados e fotos ficam salvos no aparelho e serão sincronizados ao recuperar conexão. |
| **Botão "Iniciar Vistoria" travado (Frota)** | Distância $> 50\text{m}$ da piscina | Aproxime-se da piscina ou digite a justificativa de auditoria pericial no campo exibido. |
| **Alerta "Chuva Ácida" no card** | Previsão de tempestade em 48h | Abra o laudo, aplique o Bicarbonato preventivo recomendado no banner e marque o checkbox. |
| **Câmera escura ou sem foco** | Lente suja ou reflexo excessivo | Limpe a lente do celular e evite reflexos diretos do sol sobre o tubo de ensaio ou fita. |
| **Laudos retidos não sincronizam** | Conexão oscilando | Toque no botão **"Sincronizar Rota"** no topo do Cockpit assim que estiver em área com boa conexão. |

---
*Manual homologado para o JHPCS Campo v4.5.0 • JHoston Pools Control System*
