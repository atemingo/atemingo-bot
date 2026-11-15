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

    'durum.description': 'Canlı durum: aktif Discord üyeleri ve launcher kullanıcıları',
    'durum.title': 'Canlı durum',
    'durum.discord': 'aktif üye',
    'durum.mc': 'çevrimiçi',
    'durum.mcOff': 'erişilemiyor',
    'durum.active': 'son 5 dk aktif',
    'durum.range': 'Bugün: **{day}** · Toplam kayıt: **{total}**',
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

    'mod.warn.word': '{user} mesajı silindi ("{label}"). Uygulanan: {action}.',
    'mod.warn.link': '{user} link paylaştı ({label}) — mesaj silindi. Uygulanan: {action}.',
    'mod.warn.file': '{user} dosya gönderdi ({label}) — mesaj silindi. Uygulanan: {action}.',
    'mod.banSkipped': 'ban kapalı, susturma uygulandı',
    'mod.raidTitle': 'Raid koruması',
    'mod.timeout': '{min} dakika zaman aşımı',
    'mod.timeoutFail': 'zaman aşımı uygulanamadı (yetki)',
    'mod.ban': 'kalıcı ban',
    'mod.banFail': 'ban uygulanamadı (yetki)',
    'mod.log': 'Otomatik moderasyon',

    'unban.title': 'Ban kaldırıldı',
    'unban.done': '{user} için ban kaldırıldı.',
    'unban.notFound': '"{query}" ban listesinde yok.',
    'unban.failed': '{user} banı kaldırılamadı (yetki).',
    'unban.reason': 'Sebep',
    'unban.logTitle': 'Ban kaldırma',
    'unban.dm': '**{guild}** sunucusundaki yasağın kaldırıldı.\nSebep: {reason}\nTekrar bekleriz: {invite}',
    'unban.dmSent': 'gönderildi',
    'unban.dmFail': 'kapalı',
    'unbanall.title': 'Toplu ban kaldırma',
    'unbanall.done': '{total} kayıttan {ok} ban kaldırıldı, {failed} başarısız.',
    'unbanall.none': 'Ban listesi boş.',
    'unbanall.failed': 'Ban listesi alınamadı (yetki).',
    'unbanall.needConfirm': 'Onay kutusu işaretlenmeli.',
    'unbanall.logTitle': 'Toplu ban kaldırma',

    'ban.title': 'Ban',
    'ban.done': '{user} sunucudan banlandı.',
    'ban.self': 'Kendini banlayamazsın.',
    'ban.notMember': '{user} sunucuda yok.',
    'ban.notBannable': '{user} banlanamadı (yetki/hiyerarşi).',
    'mute.title': 'Zaman aşımı',
    'mute.done': '{user} için {time} zaman aşımı uygulandı.',
    'mute.removed': '{user} için zaman aşımı kaldırıldı.',
    'mute.failed': '{user} için zaman aşımı uygulanamadı (yetki).',
    'mute.notMember': '{user} sunucuda yok.',
    'mute.notModeratable': '{user} susturulamıyor (yetki/hiyerarşi).',
    'lock.title': 'Kanal kilitlendi',
    'lock.locked': '{channel} kanalı @everyone için kilitlendi.',
    'lock.unlockedTitle': 'Kanal açıldı',
    'lock.unlocked': '{channel} kanalının kilidi kaldırıldı.',
    'lock.failed': '{channel} kanalı güncellenemedi (yetki).',
    'lock.notChannel': 'Bu kanal kilitlenemiyor.',

    'kick.title': 'Sunucudan atıldı',
    'kick.done': '{user} sunucudan atıldı, sebep DM ile gönderildi.',
    'kick.self': 'Kendini atamazsın.',
    'kick.notMember': '{user} sunucuda yok.',
    'kick.notKickable': '{user} atılamadı (yetki/hiyerarşi).',
    'ticket.title': 'Destek talebi',
    'ticket.body': '{user} destek talebi açtı.\nYetkili: {staff}\nSebep: {reason}\n\nKapatmak için aşağıdaki butona bas.',
    'ticket.opened': 'Talep açıldı: {channel}',
    'ticket.failed': 'Kanal açılamadı (yetki).',
    'ticket.noPerm': 'Botun kanal yönetme izni yok.',
    'ticket.denied': 'Bu talebi sadece sahibi veya yetkili kapatabilir.',
    'ticket.closing': 'Talep 3 saniye içinde kapatılıyor.',
    'ticket.closeButton': 'Talebi kapat',
    'ticketgui.desc': 'Aşağıdaki **Destek Talebini Oluştur** butonlarından birine basarak talebini oluşturabilirsin.',
    'ticketgui.partnerLabel': 'Partner Server Appeal',
    'ticketgui.bugLabel': 'Bug-Report',
    'ticketgui.installLabel': "I can't install",
    'ticketgui.partnerTitle': 'Partner Server Appeal',
    'ticketgui.bugTitle': 'Bug Report',
    'ticketgui.installTitle': "I can't install",
    'ticketgui.intro': '{user} talebini açtı.\nYetkili: {staff}\n\nSorununu, ekran görüntüsünü ve sistem bilgini yaz. Kapatmak için aşağıdaki butonu kullan.',
    'ticketgui.posted': 'Panel {channel} kanalına gönderildi.',
    'ticketgui.failed': 'Panel gönderilemedi (yetki veya kanal).',
    'ticketgui.alreadyOpen': 'Zaten açık bir destek kanalın var: {channel}',
    'auto.askOs': 'Hangi işletim sistemini kullanıyorsun — **Windows** mu, **Linux** mu (deb dahil)? Yaz, indirme linkini hemen atayım.',
    'auto.windows': 'Windows indirme linki:\n{windows}\n\nKurduktan sonra Microsoft hesabınla giriş yap, sunuculara tek tıkla bağlan.',
    'auto.linux': 'Linux / .deb indirme linki:\n{linux}',
    'auto.siteOnly': 'Tüm sürümler ve indirme dosyaları:\n{site}',
    'auto.trust': "Atemingo Launcher açık kaynaklı bir Minecraft launcher'ı — içinde **rat, trojan, token stealer, keylogger yok**. Giriş Microsoft OAuth ile yapılıyor; şifre veya token hiçbir yere gönderilmiyor. İstersen sanal makinede açıp kendin test edebilirsin.\n\nKaynak: {github}",
    'auto.founder': '<@{owner}> kurucu bu mesajınıza bakacak.',
    'otorol.title': 'Otorol',
    'otorol.list': 'Yeni üyelere verilen roller:\n{roles}',
    'otorol.empty': 'Aktif otorol yok. `/otorol role:@rol` ile ekle.',
    'otorol.added': 'Eklendi',
    'otorol.removed': 'Kaldırıldı',
    'otorol.managed': 'Bot rollerini otorol olarak kullanamazsın.',
    'temizle.title': 'Mesajlar silindi',
    'temizle.done': '{channel} kanalından {count} mesaj silindi.',
    'temizle.failed': 'Mesajlar silinemedi (yetki veya kanal).',
    'temizle.old': '{count} mesaj 14 günden eski olduğu için silinemedi.',
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

    'durum.description': 'Live status: active Discord members and launcher users',
    'durum.title': 'Live status',
    'durum.discord': 'active members',
    'durum.mc': 'online',
    'durum.mcOff': 'unreachable',
    'durum.active': 'active in the last 5 min',
    'durum.range': 'Today: **{day}** · Total records: **{total}**',
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

    'mod.warn.word': '{user} message deleted ("{label}"). Applied: {action}.',
    'mod.warn.link': '{user} posted a link ({label}) — message deleted. Applied: {action}.',
    'mod.warn.file': '{user} posted a file ({label}) — message deleted. Applied: {action}.',
    'mod.banSkipped': 'ban disabled, timeout applied',
    'mod.raidTitle': 'Raid protection',
    'mod.timeout': '{min} minute timeout',
    'mod.timeoutFail': 'timeout failed (permissions)',
    'mod.ban': 'permanent ban',
    'mod.banFail': 'ban failed (permissions)',
    'mod.log': 'Automatic moderation',

    'unban.title': 'Ban lifted',
    'unban.done': 'Ban lifted for {user}.',
    'unban.notFound': '"{query}" is not in the ban list.',
    'unban.failed': 'Could not lift ban for {user} (permissions).',
    'unban.reason': 'Reason',
    'unban.logTitle': 'Ban lifted',
    'unban.dm': 'Your ban in **{guild}** has been lifted.\nReason: {reason}\nYou are welcome back: {invite}',
    'unban.dmSent': 'sent',
    'unban.dmFail': 'closed',
    'unbanall.title': 'Bulk unban',
    'unbanall.done': '{ok} of {total} bans lifted, {failed} failed.',
    'unbanall.none': 'The ban list is empty.',
    'unbanall.failed': 'Could not read the ban list (permissions).',
    'unbanall.needConfirm': 'The confirm option must be checked.',
    'unbanall.logTitle': 'Bulk unban',

    'ban.title': 'Ban',
    'ban.done': '{user} was banned from the server.',
    'ban.self': 'You cannot ban yourself.',
    'ban.notMember': '{user} is not in the server.',
    'ban.notBannable': 'Could not ban {user} (permissions/hierarchy).',
    'mute.title': 'Timeout',
    'mute.done': 'Timeout of {time} applied to {user}.',
    'mute.removed': 'Timeout lifted for {user}.',
    'mute.failed': 'Could not timeout {user} (permissions).',
    'mute.notMember': '{user} is not in the server.',
    'mute.notModeratable': 'Cannot timeout {user} (permissions/hierarchy).',
    'lock.title': 'Channel locked',
    'lock.locked': '{channel} is locked for @everyone.',
    'lock.unlockedTitle': 'Channel unlocked',
    'lock.unlocked': '{channel} is unlocked.',
    'lock.failed': 'Could not update {channel} (permissions).',
    'lock.notChannel': 'That channel cannot be locked.',

    'kick.title': 'Kicked',
    'kick.done': '{user} was kicked, reason sent via DM.',
    'kick.self': 'You cannot kick yourself.',
    'kick.notMember': '{user} is not in the server.',
    'kick.notKickable': 'Could not kick {user} (permissions/hierarchy).',
    'ticket.title': 'Support ticket',
    'ticket.body': '{user} opened a ticket.\nStaff: {staff}\nReason: {reason}\n\nPress the button below to close it.',
    'ticket.opened': 'Ticket opened: {channel}',
    'ticket.failed': 'Could not create the channel (permissions).',
    'ticket.noPerm': 'The bot lacks Manage Channels permission.',
    'ticket.denied': 'Only the owner or staff can close this ticket.',
    'ticket.closing': 'Closing the ticket in 3 seconds.',
    'ticket.closeButton': 'Close ticket',
    'ticketgui.desc': 'Press one of the **Create a Support Ticket** buttons below to open your ticket.',
    'ticketgui.partnerLabel': 'Partner Server Appeal',
    'ticketgui.bugLabel': 'Bug-Report',
    'ticketgui.installLabel': "I can't install",
    'ticketgui.partnerTitle': 'Partner Server Appeal',
    'ticketgui.bugTitle': 'Bug Report',
    'ticketgui.installTitle': "I can't install",
    'ticketgui.intro': '{user} opened this ticket.\nStaff: {staff}\n\nDescribe the issue, attach a screenshot and your system info. Use the button below to close it.',
    'ticketgui.posted': 'Panel posted in {channel}.',
    'ticketgui.failed': 'Could not post the panel (permissions or channel).',
    'ticketgui.alreadyOpen': 'You already have an open ticket: {channel}',
    'auto.askOs': 'Which operating system are you on — **Windows** or **Linux** (deb included)? Tell me and I will send the download link.',
    'auto.windows': 'Windows download link:\n{windows}\n\nAfter installing, sign in with your Microsoft account and join servers with one click.',
    'auto.linux': 'Linux / .deb download link:\n{linux}',
    'auto.siteOnly': 'All versions and download files:\n{site}',
    'auto.trust': 'Atemingo Launcher is an open-source Minecraft launcher — there is no **rat, trojan, token stealer or keylogger** in it. Sign-in runs through Microsoft OAuth; no password or token is ever sent anywhere. You can open it in a virtual machine and verify it yourself.\n\nSource: {github}',
    'auto.founder': '<@{owner}> the founder will look at your message.',
    'otorol.title': 'Autorole',
    'otorol.list': 'Roles given to new members:\n{roles}',
    'otorol.empty': 'No autoroles yet. Add one with `/otorol role:@role`.',
    'otorol.added': 'Added',
    'otorol.removed': 'Removed',
    'otorol.managed': 'Bot-managed roles cannot be used as autoroles.',
    'temizle.title': 'Messages deleted',
    'temizle.done': 'Deleted {count} messages in {channel}.',
    'temizle.failed': 'Could not delete the messages (permissions or channel).',
    'temizle.old': '{count} messages were older than 14 days and could not be deleted.',
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
  const chosen = typeof interaction.options?.getString === 'function' ? interaction.options.getString('language') : null;
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
