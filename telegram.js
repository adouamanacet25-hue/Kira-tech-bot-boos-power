const IMG = {
  start: 'https://i.ibb.co/qMB2vwyc/CC115-F02-AA9-A-4-EB4-BEE0-F962750-E3235.jpg',
  help: 'https://i.ibb.co/Vcrt6Qv5/AD0-D933-F-71-C6-4631-93-A5-51-F30-E20296-D.jpg',
  contact: 'https://i.ibb.co/Pv3zFvPC/AD7-F4-C7-B-C5-F8-4-F01-A696-422-BD17011-FA.jpg',
  users: 'https://i.ibb.co/Tqw4yhpC/07-F980-B1-D866-4-D3-E-8919-51-DE8-BBA6-E9-B.jpg',
  connected: 'https://i.ibb.co/j1MzHQJ/7-B34-E307-35-D4-4331-89-DE-CCE2-D67-E44-BB.jpg',
  control: 'https://i.ibb.co/XhSNjmQ/72-E27-F51-6275-4254-ADAC-EA3949-BE0-D2-D.jpg'
};
const SIG = '> power by Mr Kira tech 🌐';
const LINKS = [
  ['📢 Suivre la chaîne Telegram', 'https://t.me/+mQ3aQpCsEqI0YmY0'],
  ['1️⃣ Rejoindre le groupe 1', 'https://t.me/+2JDC_Be4_ww1N2Vk'],
  ['2️⃣ Rejoindre le groupe 2', 'https://t.me/+Z-P_xjUgJjU0MjM0'],
  ['📢 Suivre la chaîne WhatsApp', 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X'],
  ['🌐 Rejoindre le groupe WhatsApp', 'https://chat.whatsapp.com/IP0nFB79rMDF0nvFSMXtDR']
];
const FREE_TRIES = 5;

const pad = (n) => String(n).padStart(2, '0');
const stamp = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())} / ${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`; };

async function sendPic(bot, chatId, img, caption, keyboard) {
  const opts = keyboard ? { caption, reply_markup: { inline_keyboard: keyboard } } : { caption };
  try { return await bot.sendPhoto(chatId, img, opts); }
  catch (e) {
    try { return await bot.sendMessage(chatId, caption, keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}); }
    catch (e2) { console.error('[tg send]', e2.message); }
  }
}

function init(ctx) {
  const bot = ctx.tg; if (!bot) return;
  const cfg = ctx.config; const db = ctx.db;
  const safe = (fn) => async (...a) => { try { await fn(...a); } catch (e) { console.error('[tg]', e.message); } };
  const addUser = (id) => { if (!db.users.includes(id)) { db.users.push(id); ctx.save(); } };
  const linkKb = () => LINKS.map(([t, u]) => [{ text: t, url: u }]);

  bot.onText(/^\/start(?:@\w+)?$/i, safe(async (msg) => {
    addUser(msg.from.id);
    const cap = `════════════════════════════════════
   ✦  ☠︎︎༒︎  𝙺𝙸𝚁𝙰 𝚃𝙴𝙲𝙷 𝙱𝙾𝚃 ༒︎☠︎︎ ✦
════════════════════════════════════
CREATOR : ⫸𝐌𝐫 𝐊𝐈𝐑𝐀┃𝗧𝗘𝗖𝗛 🌐⫷

👋 Bienvenue sur Shadow Kira Bot
Rejoins nos canaux & groupes pour continuer.

Tape /menu pour continuer`;
    await sendPic(bot, msg.chat.id, IMG.start, cap, linkKb());
  }));

  bot.onText(/^\/menu(?:@\w+)?$/i, safe(async (msg) => {
    addUser(msg.from.id);
    const cap = `━━━━━━━━━━━━━━━━━━━
︎༒︎  𝙺𝙸𝚁𝙰 𝚃𝙴𝙲𝙷 𝙱𝙾𝚃 ༒︎
⚜️ Auteur : Mr Kira Tech 🌐
🔗 Lien : ${cfg.botLink}
╔══════════════════════════╗
📜 COMMANDES TÉLÉGRAM
╚══════════════════════════╝

▶️ /start ➜ Démarrer le bot
📋 /menu ➜ Afficher le menu
❓ /help ➜ Aide
🔗 /pair ➜ Lancer un appairage WhatsApp
📲 /link ➜ Obtenir le lien
📩 /contact ➜ Nous contacter
📊 /users ➜ Nombre d'utilisateurs

━━━━━━━━━━━━━━━━━━
Tape /help pour de l'aide
━━━━━━━━━━━━━━━━━━
${SIG}`;
    await sendPic(bot, msg.chat.id, IMG.start, cap);
  }));

  bot.onText(/^\/help(?:@\w+)?$/i, safe(async (msg) => {
    const cap = `━━━━━━━━━━━━━━━━━━━━
⚡ ︎ ☠︎︎༒︎  𝙺𝙸𝚁𝙰 𝚃𝙴𝙲𝙷 𝙱𝙾𝚃 ༒︎☠︎︎ ︎ ︎ ︎
━━━━━━━━━━━━━━━━━━━━
1️⃣ Tapez ➜ /pair
2️⃣ Envoyez le numéro à connecter à WhatsApp
3️⃣ Une fois connecté ✅
4️⃣ Vous verrez les commandes pour contrôler ce compte depuis Telegram

NB : 5 essais gratuits 🆓
━━━━━━━━━━━━━━━━━━━`;
    await sendPic(bot, msg.chat.id, IMG.help, cap);
  }));

  bot.onText(/^\/link(?:@\w+)?$/i, safe(async (msg) => {
    const kb = [
      [{ text: LINKS[0][0], url: LINKS[0][1] }], [{ text: '1️⃣ Groupe 1', url: LINKS[1][1] }],
      [{ text: '2️⃣ Groupe 2', url: LINKS[2][1] }], [{ text: '📢 Chaîne WhatsApp', url: LINKS[3][1] }],
      [{ text: '🌐 Groupe WhatsApp', url: LINKS[4][1] }]
    ];
    await sendPic(bot, msg.chat.id, IMG.help, '🔗 Nos liens officiels 👇', kb);
  }));

  bot.onText(/^\/contact(?:@\w+)?$/i, safe(async (msg) => {
    await sendPic(bot, msg.chat.id, IMG.contact, '📩 Support Kira Tech\nClique sur le bouton ci-dessous pour contacter l\'équipe.',
      [[{ text: '💬 Contacter le support', url: cfg.support }]]);
  }));

  bot.onText(/^\/users?(?:@\w+)?$/i, safe(async (msg) => {
    const n = String(db.users.length).padStart(5, '0');
    const cap = `━━━━━━━━━━━━━━━━━━
✦  ☠︎︎༒︎  𝙺𝙸𝚁𝙰 𝚃𝙴𝙲𝙷 𝙱𝙾𝚃 ༒︎☠︎︎ ✦
⚜️ By Mr Kira Tech 🌐
━━━━━━━━━━━━━━━━━━━
╔══════════════════════════╗
👥 Nombre d'utilisateurs : ( ${n} ) 🚹🚺
╚══════════════════════════╝
🔗 Bot : ${cfg.botLink}
> Mr Kira tech 🌐`;
    await sendPic(bot, msg.chat.id, IMG.users, cap,
      [[{ text: '📤 Partager le lien du bot', url: 'https://t.me/share/url?url=' + encodeURIComponent(cfg.botLink) }]]);
  }));

  bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/i, safe(async (msg, match) => {
    addUser(msg.from.id);
    const chatId = msg.chat.id;
    const raw = (match && match[1] ? match[1] : '').trim();
    const number = raw.replace(/[\s\-]/g, '');
    if (!/^\d{8,15}$/.test(number)) {
      return bot.sendMessage(chatId, `⚠️❌ ERREUR : NUMÉRO ERRONÉ ❌⚠️
━━━━━━━━━━━━━━━━━━
🚫 Le numéro que tu as tapé est invalide.
📲 Format correct : 242XXXXXXXX
⛔ Sans le (+) devant.
✅ Exemple : 242XXXXXXXX

🔁 Réessaie : ➜ /pair 242XXXXXXXX
━━━━━━━━━━━━━━━━━━━
> power by Mr kira tech 🌐`);
    }
    const uid = String(msg.from.id);
    db.tries[uid] = db.tries[uid] || 0;
    if (db.tries[uid] >= FREE_TRIES) {
      return bot.sendMessage(chatId, `🆓 Tes ${FREE_TRIES} essais gratuits sont terminés.\n💬 Contacte le support pour continuer : ${cfg.supportUser}\n\n${SIG}`);
    }
    await bot.sendMessage(chatId, `📡 Demande en cours pour ${number}… 🔄`);
    let code = null;
    try {
      ctx.pending.set(number, chatId);
      db.owners[number] = chatId;
      code = await ctx.startSession(number, { pair: true });
    } catch (e) { console.error('[pair]', e.message); ctx.sessions.delete(number); ctx.pending.delete(number); }
    if (!code) {
      return bot.sendMessage(chatId, `🔄 Impossible de générer un code pour ${number} pour le moment.\n📲 Vérifie le numéro (ou qu'il n'est pas déjà connecté) puis réessaie : /pair ${number}`);
    }
    db.tries[uid]++; ctx.save();
    const cap = `━━━━━━━━━━━━━━━━━━━
📲 PAIRING CODE pour ${number} ☑️
━━━━━━━━━━━━━━━━━━━
╔══════════════════════════╗
🔑 CODE DE JUMULAGE :
╚══════════════════════════╝

    ┌───────────────┐
    │  ${code}    │
    └───────────────┘

━━━━━━━━━━━━━━━━━━━━━━
👉 INSTRUCTIONS :
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Envoie ce code au numéro à connecter 📱
2️⃣ Va dans « Appareils liés » 🔗 ➜ « Lier un appareil » ➕
3️⃣ Entre ce code pour associer ce bot 🤖

━━━━━━━━━━━━━━━━━━━━━━
✅ Une fois connecté, tape .menu pour continuer 📜
━━━━━━━━━━━━━━━━━━━
${SIG}`;
    await sendPic(bot, chatId, IMG.help, cap, [[
      { text: '📄 Copier', copy_text: { text: code } },
      { text: '⛔ Check', callback_data: 'check' }
    ]]);
  }));

  bot.on('callback_query', safe(async (q) => {
    if (q.data === 'check') {
      const n = [...ctx.sessions.values()].filter((s) => s.open).length;
      await bot.answerCallbackQuery(q.id, { text: `📱 Numéros connectés au bot : ${n}`, show_alert: true });
    } else await bot.answerCallbackQuery(q.id);
  }));
}

async function onConnected(ctx, number, chatId) {
  const bot = ctx.tg; if (!bot) return;
  const box = `╔══════════════════════════╗
✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${stamp()}
⚜️ BY ➜ Mr Kira Tech ⚜️
╚══════════════════════════╝`;
  await sendPic(bot, chatId, IMG.connected, `✨━━━━━━━━━━━━━━━━━━━━✨
🎊🎉 CONGRATULATIONS ! 🎉🎊
✨━━━━━━━━━━━━━━━━━━━━✨

${box}
━━━━━━━━━━━━━━━━━━━━`);
  await sendPic(bot, chatId, IMG.control, box + `\n\n📱 Numéro : ${number}\n▶️ Envoie .menu depuis WhatsApp pour contrôler le bot.`);
}

module.exports = { init, onConnected };
