require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const TelegramBot = require('node-telegram-bot-api');
const B = require('@whiskeysockets/baileys');
const makeWASocket = B.default || B.makeWASocket;

process.on('uncaughtException', (e) => console.error('[uncaughtException]', e && e.message));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e && (e.message || e)));

const PORT = process.env.PORT || 3000;
const AUTH = path.join(__dirname, 'auth');
const DATA = path.join(__dirname, 'data');
fs.ensureDirSync(AUTH); fs.ensureDirSync(DATA);

// ---------- Base de données JSON ----------
const DB_FILE = path.join(DATA, 'db.json');
let db = { users: [], tries: {}, owners: {}, groups: {}, warns: {}, bans: {}, blacklist: [], whitelist: [], afk: {}, seen: {}, userStats: {}, stats: { commands: 0, messages: 0 }, prefix: '.' };
try { db = Object.assign(db, fs.readJsonSync(DB_FILE)); } catch (e) {}
let saveTimer = null;
const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeJson(DB_FILE, db).catch(() => {}), 1500); };

const ctx = {
  db, save, sessions: new Map(), pending: new Map(), startTime: Date.now(), tg: null,
  config: {
    botName: '☠︎︎༒︎  𝙺𝙸𝚁𝙰 𝚃𝙴𝙲𝙷 𝙱𝙾𝚃 ༒︎☠︎︎',
    author: '⫸ 𝐌𝐫 𝐊𝐈𝐑𝐀 ┃ 𝗧𝗘𝗖𝗛 🌐 ⫷',
    prefix: '.', owner: process.env.OWNER_NUMBER || '242061167625',
    botLink: process.env.BOT_LINK || 'https://t.me/Kira_tech_bot', botUser: '@Kira_tech_bot',
    support: process.env.SUPPORT_LINK || 'https://t.me/KIRA_SUPPORT_HUB', supportUser: '@KIRA_SUPPORT_HUB',
    email: 'adouamanacet25@gmail.com',
    waChannel: process.env.WA_CHANNEL || 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X',
    waGroup: 'https://chat.whatsapp.com/IP0nFB79rMDF0nvFSMXtDR',
    botImg: 'https://i.ibb.co/qMB2vwyc/CC115-F02-AA9-A-4-EB4-BEE0-F962750-E3235.jpg'
  }
};

// ---------- Express + anti-sleep ----------
const app = express();
app.get('/', (req, res) => res.send('Kira Tech Bot en ligne ✅'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log('HTTP sur le port', PORT));
setInterval(() => {
  const url = (process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`) + '/ping';
  axios.get(url, { timeout: 15000 }).catch(() => {});
}, 10 * 60 * 1000);

// ---------- Telegram ----------
if (process.env.TELEGRAM_TOKEN) {
  ctx.tg = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
  ctx.tg.on('polling_error', (e) => console.error('[polling_error]', e && e.message));
} else console.error('TELEGRAM_TOKEN manquant');

const telegram = require('./telegram.js');
const whatsapp = require('./whatsapp.js');
const evenement = require('./evenement.js');
ctx.totalCmds = whatsapp.TOTAL;

// ---------- Sessions WhatsApp (Baileys) ----------
async function startSession(number, { pair = false } = {}) {
  const dir = path.join(AUTH, number);
  await fs.ensureDir(dir);
  const { state, saveCreds } = await B.useMultiFileAuthState(dir);
  let version;
  try { version = (await B.fetchLatestBaileysVersion()).version; } catch (e) {}
  const sock = makeWASocket({
    version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false,
    browser: B.Browsers ? B.Browsers.ubuntu('Chrome') : ['Kira Tech', 'Chrome', '1.0'], markOnlineOnConnect: false
  });
  const old = ctx.sessions.get(number);
  if (old && old.sock && old.sock !== sock) { try { old.sock.ev.removeAllListeners(); old.sock.end(); } catch (e) {} }
  ctx.sessions.set(number, { sock, number, open: false });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    try {
      const { connection, lastDisconnect } = u;
      if (connection === 'open') {
        const s = ctx.sessions.get(number); if (s) s.open = true;
        if (ctx.pending.has(number)) {
          const chatId = ctx.pending.get(number); ctx.pending.delete(number);
          await telegram.onConnected(ctx, number, chatId);
        }
      }
      if (connection === 'close') {
        const s = ctx.sessions.get(number); if (s) s.open = false;
        const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
        if (code === B.DisconnectReason.loggedOut) {
          ctx.sessions.delete(number); ctx.pending.delete(number);
          await fs.remove(dir).catch(() => {});
        } else setTimeout(() => startSession(number).catch((e) => console.error('[reconnect]', e.message)), 3000);
      }
    } catch (e) { console.error('[connection.update]', e.message); }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages || []) {
      try {
        if (type !== 'notify' && type !== 'append') continue;
        ctx.db.stats.messages++;
        const stop = await evenement.onMessage(sock, msg, ctx);
        if (stop) continue;
        await whatsapp.handle(sock, msg, ctx);
      } catch (e) { console.error('[message]', e.message); }
    }
  });
  sock.ev.on('group-participants.update', async (u) => {
    try { await evenement.onGroup(sock, u, ctx); } catch (e) { console.error('[group]', e.message); }
  });

  if (pair && !state.creds.registered) {
    await new Promise((r) => setTimeout(r, 3000));
    const raw = await sock.requestPairingCode(number);
    return raw && raw.length === 8 ? raw.slice(0, 4) + '-' + raw.slice(4) : raw;
  }
  return null;
}
ctx.startSession = startSession;

telegram.init(ctx);
evenement.initTelegram(ctx);
evenement.startAds(ctx);

// Restauration des sessions existantes
(async () => {
  try {
    const dirs = (await fs.readdir(AUTH)).filter((d) => /^\d+$/.test(d));
    for (const n of dirs) {
      await startSession(n).catch((e) => console.error('[restore]', n, e.message));
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (e) { console.error('[restore]', e.message); }
})();
