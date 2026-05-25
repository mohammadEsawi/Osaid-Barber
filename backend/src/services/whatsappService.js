const https   = require('https');
const { query } = require('../config/database');

const INSTANCE = process.env.ULTRAMSG_INSTANCE;
const TOKEN    = process.env.ULTRAMSG_TOKEN;

// ── تطبيع رقم الهاتف ─────────────────────────────────────────────────────────
// 05XXXXXXXX → 9725XXXXXXXX
const normalizePhone = (phone) => {
  const p = phone.replace(/[\s\-\(\)\+]/g, '');
  if (p.startsWith('05'))  return '972' + p.substring(1);
  if (p.startsWith('972')) return p;
  return p;
};

// ── إرسال رسالة واتساب ──────────────────────────────────────────────────────
const sendMessage = async (to, body) => {
  if (!INSTANCE || !TOKEN) {
    console.log('[WhatsApp] غير مُهيَّأ — تخطي الرسالة إلى', to);
    return;
  }
  const phone   = normalizePhone(to);
  const payload = new URLSearchParams({ token: TOKEN, to: phone, body }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.ultramsg.com',
        path:     `/${INSTANCE}/messages/chat`,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log('[WhatsApp] رد UltraMsg:', data);
          resolve(data);
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// ── قراءة إعدادات WhatsApp من قاعدة البيانات ─────────────────────────────────
const getWhatsAppSettings = async () => {
  const res = await query(
    `SELECT key, value FROM settings
     WHERE key IN (
       'whatsapp_confirmation_enabled',
       'whatsapp_reminder_enabled',
       'whatsapp_confirmation_template',
       'whatsapp_reminder_template'
     )`
  );
  const map = {};
  for (const row of res.rows) map[row.key] = row.value;
  return {
    confirmationEnabled: (map.whatsapp_confirmation_enabled ?? 'true') === 'true',
    reminderEnabled:     (map.whatsapp_reminder_enabled     ?? 'true') === 'true',
    confirmationTemplate: map.whatsapp_confirmation_template || DEFAULT_CONFIRMATION,
    reminderTemplate:     map.whatsapp_reminder_template     || DEFAULT_REMINDER,
  };
};

// ── تنسيق التاريخ والوقت ─────────────────────────────────────────────────────
const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const formatDateAr = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_AR[m - 1]} ${y}`;
};
const formatTimeAr = (timeStr) => {
  const [hStr, mStr] = timeStr.substring(0, 5).split(':');
  const h      = parseInt(hStr);
  const period = h < 12 ? 'ص' : 'م';
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${period}`;
};

// ── تطبيق المتغيرات على القالب ───────────────────────────────────────────────
const applyTemplate = (template, vars) =>
  template
    .replace(/\{name\}/g,     vars.name     || '')
    .replace(/\{date\}/g,     vars.date     || '')
    .replace(/\{time\}/g,     vars.time     || '')
    .replace(/\{barber\}/g,   vars.barber   || '')
    .replace(/\{services\}/g, vars.services || '')
    .replace(/\{price\}/g,    vars.price    || '')
    .replace(/\{id\}/g,       vars.id       || '');

// ── القوالب الافتراضية ────────────────────────────────────────────────────────
const DEFAULT_CONFIRMATION =
  'مرحباً {name} 👋\n' +
  'تم تأكيد حجزك في صالون أسيد ✅\n\n' +
  '📅 {date}\n' +
  '⏰ {time}\n' +
  '💈 {barber}\n' +
  '✂️ {services} — {price}₪\n\n' +
  'رقم حجزك: #{id}';

const DEFAULT_REMINDER =
  'تذكير 🔔\n' +
  'موعدك في صالون أسيد بعد 30 دقيقة!\n\n' +
  '⏰ {time}\n' +
  '💈 {barber}\n\n' +
  'نراك قريباً ✂️';

// ── رسالة تأكيد الحجز ────────────────────────────────────────────────────────
const sendConfirmation = async ({ customerName, customerPhone, date, startTime, barberName, services, totalPrice, appointmentId }) => {
  try {
    const settings = await getWhatsAppSettings();
    if (!settings.confirmationEnabled) return;

    const body = applyTemplate(settings.confirmationTemplate, {
      name:     customerName,
      date:     formatDateAr(date),
      time:     formatTimeAr(startTime),
      barber:   barberName,
      services: services.map((s) => s.name).join(' + '),
      price:    String(totalPrice),
      id:       String(appointmentId),
    });

    await sendMessage(customerPhone, body);
    console.log(`[WhatsApp] تأكيد أُرسل إلى ${customerPhone}`);
  } catch (err) {
    console.error('[WhatsApp] فشل إرسال التأكيد:', err.message);
  }
};

// ── رسالة تذكير قبل 30 دقيقة ─────────────────────────────────────────────────
const sendReminder = async ({ customerName, customerPhone, startTime, barberName }) => {
  try {
    const settings = await getWhatsAppSettings();
    if (!settings.reminderEnabled) return;

    const body = applyTemplate(settings.reminderTemplate, {
      name:   customerName,
      time:   formatTimeAr(startTime),
      barber: barberName,
    });

    await sendMessage(customerPhone, body);
    console.log(`[WhatsApp] تذكير أُرسل إلى ${customerPhone}`);
  } catch (err) {
    console.error('[WhatsApp] فشل إرسال التذكير:', err.message);
  }
};

module.exports = { sendConfirmation, sendReminder, DEFAULT_CONFIRMATION, DEFAULT_REMINDER };
