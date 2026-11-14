# Ponte WhatsApp (QR code) - BahiaCred

Roda no **computador da loja**, sempre ligado. Conecta o WhatsApp do número da loja pelo QR code,
grava as mensagens no banco e envia as respostas que a equipe clicar no sistema.

## Instalação (uma vez)
1. Instale o **Node.js** (versão LTS) em https://nodejs.org (é gratuito).
2. Abra esta pasta (`whatsapp-bridge`) no terminal.
3. Rode: `npm install`
4. Copie `.env.example` para `.env` e preencha `SUPABASE_SERVICE_KEY` (Project Settings > API > service_role).
   **Não compartilhe esse arquivo.**

## Uso
- Rode: `npm start`
- Vai aparecer um QR code. No celular da loja: WhatsApp > Aparelhos conectados > Conectar aparelho.
- Quando aparecer "WhatsApp conectado", deixe a janela aberta o tempo todo.
- Se a sessão cair no celular, apague a pasta `auth` e rode de novo.

## Avisos
- Essa conexão **não é oficial** da Meta. Use com moderação: nada de envio em massa.
- Se o computador desligar ou perder internet, o atendimento para até ligar de novo.
