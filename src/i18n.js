'use strict';

const LANGS = ['tr', 'en'];

const STRINGS = {
  tr: {
    'common.error': 'Komut çalıştırılamadı.',
    'common.staffOnly': 'Bu komut yetkiliye ait.',
    'common.noServer': 'Eşleşen sunucu yok.',
    'common.noSponsor': 'Henüz sponsor yok.',
    'common.notFound': 'Bulunamadı.',

    'indir.description': 'Atemingo Launcher indirme bağlantıları',
    'indir.desc': 'Microsoft hesabınla giriş yap, mod kur, sunuculara tek tıkla bağlan, pelerinini seç. Windows ve Linux, ücretsiz.',
    'indir.windows': 'Windows',
    'indir.linux': 'Linux',
    'indir.github': 'GitHub',
    'indir.footer': 'Kurulumdan sonra /ip ile sunucu adreslerini al',

    'site.description': 'Atemingo bağlantıları',
    'site.title': 'Atemingo',
    'site.site': 'Site',
    'site.github': 'GitHub',
    'site.discord': 'Discord',

    'ip.description': 'Minecraft sunucu adresleri',
    'ip.search': 'Sunucu adında ara',
    'ip.title': 'Sunucular',
    'ip.footer': 'Adrese tıklayınca kopyalanır',
    'ip.online': '{n} çevrimiçi',

    'sponsor.description': 'Sponsorlar ve iş ortakları',
    'sponsor.title': 'Sponsorlar',

    'surum.description': 'Yayındaki sürüm numarası ve değişiklik notları',
    'surum.title': 'Atemingo Launcher v{version}',
    'surum.new': 'Yeni sürüm: Atemingo Launcher v{version}',
    'surum.release': 'Sürüm',
    'surum.noData': 'Sürüm bilgisi alınamadı. Site: {site}',
    'surum.announce': '@everyone yeni sürüm çıktı',

    'durum.description': 'Canlı durum: Discord üyeleri, sunucu, launcher',
    'durum.title': 'Canlı durum',
    'durum.discord': 'üye',
    'durum.mc': 'çevrimiçi',
    'durum.mcOff': 'erişilemiyor',
    'durum.active': 'aktif kullanıcı',
    'durum.updated': 'Son güncelleme · {time}',



    'duyuru.description': 'Duyuru gönder',
    'duyuru.title': 'Başlık',
    'duyuru.message': 'İçerik',
    'duyuru.channel': 'Hedef kanal',
    'duyuru.mention': '@everyone etiketle',
    'duyuru.sent': 'Duyuru <#{channel}> kanalına gönderildi.',
    'duyuru.badChannel': 'Kanal yazmaya uygun değil.',

    'dil.description': 'Yanıt dili / Response language',
    'dil.option': 'Dil / Language',
    'dil.set': 'Dil kaydedildi: {lang}',

    'hosgeldin.title': '{user} aramıza katıldı',
    'hosgeldin.desc': 'Hoş geldin <@{id}>.\nLauncher: {site}\nİndirme ve kurulum için `/indir`',

    'mod.warn': '{user} mesajı silindi ("{word}"). Uygulanan: {action}.',
    'mod.timeout': '{min} dakika zaman aşımı',
    'mod.timeoutFail': 'zaman aşımı uygulanamadı (yetki)',
    'mod.ban': 'kalıcı ban',
    'mod.banFail': 'ban uygulanamadı (yetki)',
    'mod.log': 'Otomatik moderasyon',
  },

  en: {
    'common.error': 'Command failed.',
    'common.staffOnly': 'Staff only.',
    'common.noServer': 'No matching server.',
    'common.noSponsor': 'No sponsors yet.',
    'common.notFound': 'Not found.',

    'indir.description': 'Atemingo Launcher download links',
    'indir.desc': 'Sign in with Microsoft, install mods, join servers in one click, pick your cape. Free on Windows and Linux.',
    'indir.windows': 'Windows',
    'indir.linux': 'Linux',
    'indir.github': 'GitHub',
    'indir.footer': 'After install, use /ip for server addresses',

    'site.description': 'Atemingo links',
    'site.title': 'Atemingo',
    'site.site': 'Site',
    'site.github': 'GitHub',
    'site.discord': 'Discord',

    'ip.description': 'Minecraft server addresses',
    'ip.search': 'Search by server name',
    'ip.title': 'Servers',
    'ip.footer': 'Click an address to copy it',
    'ip.online': '{n} online',

    'sponsor.description': 'Sponsors and partners',
    'sponsor.title': 'Sponsors',

    'surum.description': 'Current version and release notes',
    'surum.title': 'Atemingo Launcher v{version}',
    'surum.new': 'New release: Atemingo Launcher v{version}',
    'surum.release': 'Release',
    'surum.noData': 'Version info unavailable. Site: {site}',
    'surum.announce': '@everyone new release is out',

    'durum.description': 'Live status: Discord members, server, launcher',
    'durum.title': 'Live status',
    'durum.discord': 'members',
    'durum.mc': 'online',
    'durum.mcOff': 'unreachable',
    'durum.active': 'active users',
    'durum.updated': 'Updated · {time}',



    'duyuru.description': 'Post an announcement',
    'duyuru.title': 'Title',
    'duyuru.message': 'Message',
    'duyuru.channel': 'Target channel',
    'duyuru.mention': 'Mention @everyone',
    'duyuru.sent': 'Announcement sent to <#{channel}>.',
    'duyuru.badChannel': 'Channel cannot receive messages.',

    'dil.description': 'Response language / Yanıt dili',
    'dil.option': 'Language / Dil',
    'dil.set': 'Language saved: {lang}',

    'hosgeldin.title': '{user} joined the server',
    'hosgeldin.desc': 'Welcome <@{id}>.\nLauncher: {site}\nUse `/download` to install',

    'mod.warn': '{user} message deleted ("{word}"). Applied: {action}.',
    'mod.timeout': '{min} minute timeout',
    'mod.timeoutFail': 'timeout failed (permissions)',
    'mod.ban': 'permanent ban',
    'mod.banFail': 'ban failed (permissions)',
    'mod.log': 'Automatic moderation',
  },
};

function t(lang, key, vars) {
  const table = STRINGS[lang] || STRINGS.tr;
  let text = table[key] ?? STRINGS.tr[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

const LANG_NAMES = { tr: 'Türkçe', en: 'English' };

function langChoices() {
  return LANGS.map((code) => ({ name: LANG_NAMES[code], value: code }));
}

function addLangOption(builder, description) {
  return builder.addStringOption((option) =>
    option
      .setName('language')
      .setDescription(description || STRINGS.en['dil.option'])
      .setDescriptionLocalizations({ tr: STRINGS.tr['dil.option'] })
      .setRequired(false)
      .addChoices(...langChoices()),
  );
}

function resolveLang(interaction, store, config) {
  const chosen = interaction.options.getString('language');
  const meta = store.meta();
  if (!meta.users || typeof meta.users !== 'object') meta.users = {};
  const current = meta.users[interaction.user.id] || {};
  if (chosen && LANGS.includes(chosen)) {
    meta.users[interaction.user.id] = { ...current, lang: chosen };
    store.save();
    return chosen;
  }
  if (current.lang && LANGS.includes(current.lang)) return current.lang;
  return LANGS.includes(config.language) ? config.language : 'tr';
}

module.exports = { t, LANGS, LANG_NAMES, langChoices, addLangOption, resolveLang };
