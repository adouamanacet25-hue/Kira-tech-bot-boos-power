const axios = require('axios');
const SIG = '> 𝙿𝚘𝚠𝚎𝚛 𝚋𝚢 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 🌐';
const cache = new Map();           // anti-delete
const flood = new Map();           // anti-spam / antiflood
const lastMsg = new Map();         // slowmode
const offlineSeen = new Map();     // message hors ligne (cooldown)
const cmdCount = new Map();        // pub auto après 3 commandes
const IMG_GOODBYE = 'https://i.ibb.co/B2cHcK7y/92-F0453-A-F3-E4-4-E6-B-8903-4-BAC4797-A01-F.jpg';
const IMG_WELCOME = 'https://i.ibb.co/xqZMd5cg/213-CD2-B1-5-BAE-4-A52-8537-CA19-B7-F93557.jpg';
const pad = (n) => String(n).padStart(2, '0');
const adDate = () => { const d = new Date(); return `${pad(d.getHours())}/${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };

const joinBlock = (kind, who, members, group, botLink) => {
  const title = kind === 'welcome' ? '[  📰*𝚠𝚎𝚕𝚌𝚘𝚖𝚎* 📰]' : '[ ☠️ *ɢᴏᴏᴅʙʏᴇ* ☠️ ]';
  return `╭┈┈┈${title}┈┈┈\n┊ ✜ ${who}\n┊ ✜ menbres : ( ${members} )\n┊ ✜ GROUPE: ( ${group} )\n├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n┊\n ꐪ ʙᴏᴛ  ➭ ${botLink}\n┊\n├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n┊ ༯ 𝙼𝚛 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 🌐\n╰┈┈┈┈ ┈┈┈ ┈┈┈ ┈╯\n— ᴅᴇᴠ ⌁ 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑  —`;
};

const adCaption = (ctx) => `--- ƘƖƦƛ ƁƠƬ ƬЄƇӇ ---\n▉ \`ƁƳ MƦ ƘƖƦƛ ƬЄƇӇ\` 🌹▉\n✅ BOT → Connecté 🤖\n🟢 STATUS → OPEN\n📅 DATE → ${adDate()}\n👤 Auteur : Mr Kira Tech 🌐\n🔑 Prefix : ${ctx.db.prefix || '.'}\n📦 Total Cmds : ${ctx.totalCmds || 0}\n🔗 lien : ${ctx.config.botLink}`;

// bouton « Rejoindre… » sous le message (carte avec lien de la chaîne)
const channelCard = (ctx) => ({ externalAdReply: { title: 'Rejoindre la chaîne WhatsApp', body: 'Kira Tech 🌐', sourceUrl: ctx.config.waChannel, mediaType: 1, renderLargerThumbnail: false, showAdAttribution: false } });


const num = (j) => String(j || '').split('@')[0].split(':')[0];
const getText = (m) => !m ? '' : (m.conversation || (m.extendedTextMessage && m.extendedTextMessage.text) ||
  (m.imageMessage && m.imageMessage.caption) || (m.videoMessage && m.videoMessage.caption) || '');
const gs = (ctx, jid) => (ctx.db.groups[jid] = ctx.db.groups[jid] || {});

async function onMessage(sock, msg, ctx) {
  const m = msg.message; const jid = msg.key.remoteJid;
  if (!m || !jid) return false;

  // Anti-delete : mise en cache + restitution
  if (jid.endsWith('@g.us')) {
    const proto = m.protocolMessage;
    if (proto && proto.type === 0 && proto.key) {
      const g = gs(ctx, jid);
      if (g.antidelete) {
        const old = cache.get(proto.key.id);
        if (old && old.message) {
          const who = num(old.key.participant || old.key.remoteJid);
          await sock.sendMessage(jid, { text: `*🚮 ANTIDELETE*\n▸ Message supprimé par @${who}\n\n${SIG}`, mentions: [who + '@s.whatsapp.net'] }).catch(() => {});
          await sock.sendMessage(jid, { forward: old }).catch(() => {});
        }
      }
      return true;
    }
    if (msg.key.id) { cache.set(msg.key.id, msg); if (cache.size > 800) cache.delete(cache.keys().next().value); }
  }
  if (!jid.endsWith('@g.us') && !msg.key.fromMe && !jid.endsWith('@broadcast') && !jid.endsWith('@newsletter')) {
    await offlineReply(sock, msg, ctx);
    return afkCheck(sock, msg, ctx);
  }
  if (msg.key.fromMe) { ctx.lastOwnerActivity = Date.now(); return afkCheck(sock, msg, ctx); }
  if (!jid.endsWith('@g.us')) return false;

  const g = gs(ctx, jid);
  const sender = msg.key.participant;
  const text = getText(m);
  ctx.db.seen[jid] = ctx.db.seen[jid] || {}; ctx.db.seen[jid][sender] = Date.now();

  let meta = null;
  const needMeta = g.antilink || g.antispam || g.antiflood || g.antibot || g.antitag || g.slowmode;
  if (needMeta) {
    meta = await sock.groupMetadata(jid).catch(() => null);
    if (!meta) return false;
    const p = meta.participants.find((x) => num(x.id) === num(sender));
    if (p && p.admin) return afkCheck(sock, msg, ctx);
  } else return afkCheck(sock, msg, ctx);

  const del = () => sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
  const kick = () => sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});

  if (g.antilink && /(chat\.whatsapp\.com\/|https?:\/\/|www\.)/i.test(text)) {
    await del();
    await sock.sendMessage(jid, { text: `*🚫 ANTILINK*\n▸ @${num(sender)} : lien interdit\n▸ Action : ${g.antilinkAction === 'delete' ? 'Message supprimé' : 'Expulsé'}\n\n${SIG}`, mentions: [sender] }).catch(() => {});
    if (g.antilinkAction !== 'delete') await kick();
    return true;
  }
  if (g.antibot && msg.key.id && msg.key.id.startsWith('BAE5')) {
    await del(); await kick(); return true;
  }
  if (g.antitag && m.extendedTextMessage && m.extendedTextMessage.contextInfo &&
      (m.extendedTextMessage.contextInfo.mentionedJid || []).length >= 5) { await del(); return true; }

  if (g.antispam || g.antiflood) {
    const limit = g.antiflood ? (g.floodLimit || 6) : (g.spamThreshold || 6);
    const k = jid + sender; const now = Date.now();
    const arr = (flood.get(k) || []).filter((t) => now - t < 10000); arr.push(now); flood.set(k, arr);
    if (arr.length > limit) {
      flood.delete(k); await del();
      await sock.sendMessage(jid, { text: `*🛑 ${g.antiflood ? 'ANTIFLOOD' : 'ANTISPAM'}*\n▸ @${num(sender)} expulsé pour spam\n\n${SIG}`, mentions: [sender] }).catch(() => {});
      await kick(); return true;
    }
  }
  if (g.slowmode) {
    const k = jid + sender; const now = Date.now();
    if (lastMsg.get(k) && now - lastMsg.get(k) < g.slowmode * 1000) { await del(); return true; }
    lastMsg.set(k, now);
  }
  return afkCheck(sock, msg, ctx);
}

async function afkCheck(sock, msg, ctx) {
  try {
    const m = msg.message; const jid = msg.key.remoteJid;
    const ci = m && m.extendedTextMessage && m.extendedTextMessage.contextInfo;
    const mentioned = (ci && ci.mentionedJid) || [];
    for (const j of mentioned) {
      const a = ctx.db.afk[num(j)];
      if (a) await sock.sendMessage(jid, { text: `😴 @${num(j)} est AFK\n▸ Raison : ${a.reason}`, mentions: [j] }, { quoted: msg });
    }
  } catch (e) {}
  return false;
}


// 1) Message reçu quand l'utilisateur est hors ligne
async function offlineReply(sock, msg, ctx) {
  try {
    const m = msg.message; if (!m || m.protocolMessage || m.reactionMessage) return;
    const text = getText(m); const prefix = ctx.db.prefix || '.';
    if (text.startsWith(prefix)) return;                       // commandes : pas de réponse hors ligne
    const owner = num(sock.user && sock.user.id);
    const last = ctx.lastOwnerActivity || 0;
    if (Date.now() - last < 15 * 60 * 1000) return;            // propriétaire actif récemment = en ligne
    const k = owner + ':' + msg.key.remoteJid;
    if (offlineSeen.get(k) && Date.now() - offlineSeen.get(k) < 6 * 3600 * 1000) return;
    offlineSeen.set(k, Date.now());
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Désolé je suis pas en ligne veuillez laisser un message 🤗 merci\n\n> 𝚙𝚘𝚠𝚎𝚛 𝚋𝚢 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 𝚋𝚘𝚝 🌐\n\n${ctx.config.waChannel}`,
      contextInfo: channelCard(ctx)
    }, { quoted: msg });
  } catch (e) {}
}

// 2) & 3) Welcome / Goodbye WhatsApp
async function onGroup(sock, u, ctx) {
  const { id: jid, participants, action } = u;
  const g = gs(ctx, jid);
  const meta = await sock.groupMetadata(jid).catch(() => null);
  const name = meta ? meta.subject : 'ce groupe';
  const count = meta ? meta.participants.length : '?';
  for (const raw of participants || []) {
    const p = typeof raw === 'string' ? raw : raw.id;
    if (action === 'add' && ctx.db.bans[jid] && ctx.db.bans[jid].includes(num(p))) {
      await sock.groupParticipantsUpdate(jid, [p], 'remove').catch(() => {}); continue;
    }
    const isW = action === 'add';
    if (!['add', 'remove'].includes(action)) continue;
    if ((isW && g.welcome === false) || (!isW && g.goodbye === false)) continue;
    const body = joinBlock(isW ? 'welcome' : 'goodbye', '@' + num(p), count, name, ctx.config.botLink) + '\n\n' + ctx.config.waChannel;
    await sock.sendMessage(jid, { image: { url: isW ? IMG_WELCOME : IMG_GOODBYE }, caption: body, mentions: [p], contextInfo: channelCard(ctx) })
      .catch(() => sock.sendMessage(jid, { text: body, mentions: [p] }).catch(() => {}));
  }
}

// 4) Publicité auto WhatsApp : après 3 commandes dans un groupe + toutes les 20 min
async function sendAd(sock, jid, ctx) {
  const cap = adCaption(ctx) + '\n\n`Rejoind la chaîne pour être au top de la tech 🦠`\n> Power by Kira Tech 🌐\n\n' + ctx.config.waChannel;
  await sock.sendMessage(jid, { image: { url: ctx.config.botImg }, caption: cap, contextInfo: channelCard(ctx) })
    .catch(() => sock.sendMessage(jid, { text: cap }).catch(() => {}));
}
async function onCommand(sock, jid, ctx) {
  try {
    if (!jid.endsWith('@g.us')) return;
    const n = (cmdCount.get(jid) || 0) + 1;
    if (n >= 3) { cmdCount.set(jid, 0); await sendAd(sock, jid, ctx); } else cmdCount.set(jid, n);
  } catch (e) {}
}
function startAds(ctx) {
  setInterval(async () => {
    for (const s of ctx.sessions.values()) {
      if (!s.open) continue;
      try {
        const groups = await s.sock.groupFetchAllParticipating();
        for (const jid of Object.keys(groups)) { await sendAd(s.sock, jid, ctx); await new Promise((r) => setTimeout(r, 4000)); }
      } catch (e) {}
    }
    // Telegram : groupes où le bot est présent
    if (ctx.tg) for (const id of ctx.db.tgGroups || []) await tgAd(ctx, id);
  }, 20 * 60 * 1000);
}

// ---------- Telegram : welcome / goodbye / pub ----------
const tgKb = (ctx) => ({ reply_markup: { inline_keyboard: [[{ text: '📢 Rejoindre la chaîne WhatsApp', url: ctx.config.waChannel }]] } });
const tgAdText = (ctx) => adCaption(ctx);
async function tgPic(ctx, chatId, img, caption, kb) {
  const opt = Object.assign({ caption }, kb || {});
  try { await ctx.tg.sendPhoto(chatId, img, opt); }
  catch (e) { try { await ctx.tg.sendMessage(chatId, caption, kb || {}); } catch (e2) {} }
}
async function tgAd(ctx, chatId) { await tgPic(ctx, chatId, ctx.config.botImg, tgAdText(ctx)); }
function initTelegram(ctx) {
  const bot = ctx.tg; if (!bot) return;
  ctx.db.tgGroups = ctx.db.tgGroups || [];
  const remember = (chat) => { if (chat && (chat.type === 'group' || chat.type === 'supergroup') && !ctx.db.tgGroups.includes(chat.id)) { ctx.db.tgGroups.push(chat.id); ctx.save(); } };
  const who = (u) => u.username ? '@' + u.username : (u.first_name || 'membre');
  bot.on('message', async (msg) => {
    try {
      remember(msg.chat);
      if (msg.new_chat_members && msg.new_chat_members.length) {
        const count = await bot.getChatMemberCount(msg.chat.id).catch(() => '?');
        for (const u of msg.new_chat_members) {
          if (u.is_bot) continue;
          await tgPic(ctx, msg.chat.id, IMG_WELCOME, joinBlock('welcome', who(u), count, msg.chat.title || 'groupe', ctx.config.botLink), tgKb(ctx));
        }
      }
      if (msg.left_chat_member && !msg.left_chat_member.is_bot) {
        const count = await bot.getChatMemberCount(msg.chat.id).catch(() => '?');
        await tgPic(ctx, msg.chat.id, IMG_GOODBYE, joinBlock('goodbye', who(msg.left_chat_member), count, msg.chat.title || 'groupe', ctx.config.botLink), tgKb(ctx));
      }
    } catch (e) { console.error('[tg event]', e.message); }
  });
  bot.on('my_chat_member', (u) => { try { remember(u.chat); } catch (e) {} });
}

module.exports = { onMessage, onGroup, onCommand, startAds, initTelegram };
