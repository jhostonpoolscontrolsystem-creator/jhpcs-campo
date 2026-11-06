# Manual do Usuário Piscineiro / Tratador de Campo
**JHoston Pools Control System (JHPCS)**
*Aplicativo de Campo PWA • Coleta Offline, Validação por Foto e Trava Anti-Fraude*

---

## 1. Visão Geral para o Piscineiro
Este manual foi feito especialmente para você, tratador e piscineiro responsável pela manutenção física e química das piscinas com revestimento monolítico da **JHoston Pools**.

O aplicativo **JHPCS Tratador** foi desenvolvido para ser extremamente rápido, prático e funcionar **mesmo quando não há internet ou sinal de celular na beira da piscina**. Com ele, você registra suas medições em menos de 2 minutos, recebe a dosagem exata de cada produto e garante o respaldo do seu trabalho perante o proprietário ou diretoria do hotel.

---

## 2. Como Acessar e Instalar o Aplicativo no Celular

O aplicativo do piscineiro é um **PWA Isolado e Independente**. Você não precisa procurar em lojas como Google Play ou Apple Store: basta abrir o link direto e instalar na tela inicial do celular com 1 toque.

### 2.1. Endereço Direto do Aplicativo
- Abra o navegador de internet do celular (Google Chrome no Android ou Safari no iPhone) e acesse:
  `https://jcs-pools.vercel.app/pwa` (ou o link direto enviado no seu WhatsApp).

### 2.2. Como Instalar na Tela Inicial do Celular
- **No Celular Android (Google Chrome)**:
  1. Ao abrir o endereço `/pwa`, toque no botão azul **"Instalar no Celular"** no topo da tela.
  2. Toque em **"Instalar"** na janela de confirmação.
  3. *(Caso o botão não apareça)*: Toque nos três pontinhos verticais `⋮` no topo superior direito do Chrome e selecione a opção **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
  4. Um ícone do **JHPCS Tratador** será criado na tela inicial do seu celular. A partir de então, você só precisará tocar nesse ícone para abrir o aplicativo em tela cheia!
- **No Celular iPhone (Apple Safari)**:
  1. Ao abrir o link no Safari, toque no ícone de compartilhamento (um quadrado com uma seta para cima `⬆` na barra inferior).
  2. Role para baixo e selecione **"Adicionar à Tela de Início"**.
  3. Toque em **"Adicionar"** no canto superior direito.
  4. O ícone do aplicativo estará disponível entre os seus outros apps.

---

## 3. Como Fazer o Login no Aplicativo
Para que você não precise digitar senhas longas enquanto trabalha no sol, o acesso de campo é simplificado:
1. Digite o seu **CPF** (ex.: `123.456.789-00`).
2. Digite o seu **PIN de 4 Dígitos** (solicite seu PIN à equipe técnica da JHoston ou utilize o PIN de homologação `1234`).
3. Toque no botão **"Acessar Roteiro do Dia"**.

---

## 4. Passo a Passo da Rotina Diária de Campo

Assim que você faz o login, o aplicativo apresenta o roteiro diário em etapas bem claras:

### Passo 1: Selecionar a Piscina do Dia
- No topo do app, escolha no menu qual piscina você está tratando (ex.: *Resort Terravista*, *Hotel Fasano*, etc.).
- O aplicativo exibe automaticamente o volume de água em metros cúbicos ($m^3$) e o tipo de revestimento.

### Passo 2: Coleta dos Parâmetros Químicos
Após realizar o teste da água com seu estojo de teste ou fita reagente, digite os valores encontrados:
- **pH**: Ajuste no controle deslizante ou digite (ex.: `7.4`).
- **Cloro Livre (ppm)**: Informe o teor de cloro (ex.: `2.0`).
- **Alcalinidade Total (ppm)**: Informe o valor (ex.: `100`).
- **Dureza Cálcica (ppm)**: Informe o valor (ex.: `250`).

### Passo 3: Checklist Físico e Operacional
Marque as caixas de seleção obrigatórias:
- [x] **Superfície Totalmente Escovada**: A escovação diária é fundamental para a cura e brilho do revestimento monolítico.
- [x] **Retrolavagem do Filtro Realizada**: Indique se lavou a areia/filtro hoje.
- [ ] **Utilização de Ácido**: ATENÇÃO: Marque somente se aplicou produto redutor de pH. *(Lembre-se: em piscinas nos primeiros 28 dias de cura, o uso de ácido é estritamente proibido!)*.

### Passo 4: Registro Fotográfico em Tempo Real (Câmera com GPS)
Para garantir que ninguém conteste a qualidade do seu trabalho:
1. Toque em **"Tirar Foto Panorâmica da Piscina"**: A câmera do celular se abrirá. Enquadre a piscina limpa e tire a foto.
2. Toque em **"Tirar Foto do Teste Químico"**: Tire uma foto nítida do tubo de ensaio ou da fita reagente ao lado da escala de cores.
- *Nota de Tecnologia*: O aplicativo comprime a foto automaticamente em **WebP (redução de 95%)** para economizar sua internet móvel e carimba a latitude e longitude exatas via satélite. Fotos tiradas da galeria não são aceitas para sua própria proteção jurídica.

### Passo 5: Enviar Registro
1. Marque o termo: *"Declaro que as informações coletadas e fotos refletem a realidade operacional do ativo"*.
2. Toque no botão verde **"Enviar Registro e Validar Garantia"**.

---

## 5. Como Funciona a Operação Offline (Sem Internet)
- Se você estiver em um local sem sinal de celular, o aplicativo mostrará uma tarja amarela: **"Modo Offline (72h)"**.
- **Não se preocupe**: você pode preencher tudo, tirar as fotos e tocar em enviar normalmente!
- O aplicativo salvará tudo com segurança na memória interna do celular (IndexedDB).
- Assim que você se conectar a uma rede Wi-Fi ou voltar para uma área com sinal 4G, o app mostrará o botão **"Sincronizar Agora"** e enviará todos os dados automaticamente para a nuvem.

---

## 6. O Que Fazer se Der Alerta "Red Zone"
- Se ao registrar os dados o aplicativo avisar que a piscina entrou em **Red Zone** (ex.: pH perigosamente baixo):
  1. Leia atentamente a **Ação Recomendada** que aparecerá na tela.
  2. Siga as orientações da calculadora de dosagem homologada pela JHostonTec.
  3. Não adicione produtos químicos caseiros ou misturas não autorizadas.
  4. O sistema já terá notificado o engenheiro responsável da JHoston Pools para dar suporte técnico a você.

---
*JHoston Pools Control System • O seu companheiro diário de trabalho e garantia de excelência!*
