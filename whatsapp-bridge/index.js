// Ponte WhatsApp (conexão por QR code) -> banco do sistema BahiaCred (Supabase).
// Recebe mensagens, grava no banco e envia as respostas que a equipe clicou no sistema.
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL_ || !KEY) { console.error('Faltou SUPABASE_URL ou SUPABASE_SERVICE_KEY no arquivo .env'); process.exit(1); }
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });

const log = pino({ level: 'warn' });

// grava um documento na coleção (mesmo formato da tabela docs usada pelo sistema)
async function gravar(col, id, data) {
  const { error } = await sb.from('docs').upsert({ col, id: String(id), data, updated_at: new Date().toISOString() }, { onConflict: 'col,id' });
  if (error) console.error('Erro ao gravar', col, error.message);
}

function textoDaMensagem(m) {
  const c = m.message || {};
  return c.conversation || (c.extendedTextMessage && c.extendedTextMessage.text) ||
         (c.imageMessage && (c.imageMessage.caption || '[imagem]')) ||
         (c.videoMessage && (c.videoMessage.caption || '[vídeo]')) ||
         (c.audioMessage && '[áudio]') || (c.documentMessage && '[documento]') || '[mensagem]';
}

async function registrarRecebida(sock, m) {
  const jid = m.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return; // ignora grupos e status
  const fone = jid.split('@')[0];
  const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
  const msgId = (m.key.fromMe ? 'out-' : 'in-') + m.key.id;
  await gravar('wa_msgs', msgId, {
    chat: jid, fone, direcao: m.key.fromMe ? 'saida' : 'entrada',
    texto: textoDaMensagem(m), ts, nomeContato: m.pushName || '', status: 'recebida'
  });
  // atualiza a conversa (lista de chats)
  const { data: atual } = await sb.from('docs').select('data').eq('col', 'wa_chats').eq('id', jid).maybeSingle();
  const d = (atual && atual.data) || {};
  await gravar('wa_chats', jid, {
    chat: jid, fone, nome: m.pushName || d.nome || fone, ultimo: textoDaMensagem(m), ultimoTs: ts,
    naoLidas: m.key.fromMe ? (d.naoLidas || 0) : (d.naoLidas || 0) + 1,
    status: d.status || 'Novo', agenteId: d.agenteId || null, clienteId: d.clienteId || null
  });
}

// Envia as mensagens que estão na fila 'wa_out' (criadas pelo sistema quando alguém clica em enviar)
let enviando = false;
async function processarFila(sock) {
  if (enviando) return;
  enviando = true;
  try {
    const { data: fila, error } = await sb.from('docs').select('id,data').eq('col', 'wa_out');
    if (error) return;
    for (const item of fila || []) {
      const o = item.data || {};
      if (o.status !== 'pendente') continue;
      try {
        const r = await sock.sendMessage(o.chat, { text: o.texto });
        await gravar('wa_out', item.id, { ...o, status: 'enviada', enviadaEm: new Date().toISOString(), waId: r && r.key && r.key.id });
        await registrarRecebidaEnvio(o, r);
      } catch (e) {
        await gravar('wa_out', item.id, { ...o, status: 'erro', erro: String(e.message || e) });
      }
    }
  } finally { enviando = false; }
}

async function registrarRecebidaEnvio(o, r) {
  const ts = new Date().toISOString();
  const msgId = 'out-' + ((r && r.key && r.key.id) || Date.now().toString());
  await gravar('wa_msgs', msgId, {
    chat: o.chat, fone: o.chat.split('@')[0], direcao: 'saida', texto: o.texto, ts,
    nomeContato: '', status: 'enviada', atendente: o.atendente || '', agenteId: o.agenteId || null
  });
}

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, logger: log, printQRInTerminal: false, browser: ['BahiaCred', 'Chrome', '1.0'] });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    if (u.qr) { console.log('\nEscaneie o QR code abaixo com o WhatsApp do número da loja (Aparelhos conectados):\n'); qrcode.generate(u.qr, { small: true }); }
    if (u.connection === 'open') console.log('WhatsApp conectado. Pode deixar este programa aberto.');
    if (u.connection === 'close') {
      const cod = u.lastDisconnect && u.lastDisconnect.error && u.lastDisconnect.error.output && u.lastDisconnect.error.output.statusCode;
      if (cod === DisconnectReason.loggedOut) { console.log('Sessão encerrada no celular. Apague a pasta auth e rode de novo para ler o QR code.'); process.exit(0); }
      console.log('Conexão caiu. Tentando reconectar...');
      setTimeout(iniciar, 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) { try { await registrarRecebida(sock, m); } catch (e) { console.error(e.message); } }
  });

  setInterval(() => processarFila(sock), 3000);
}

iniciar();
