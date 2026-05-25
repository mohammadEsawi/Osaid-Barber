const https = require('https');

const INSTANCE = process.env.ULTRAMSG_INSTANCE;
const TOKEN    = process.env.ULTRAMSG_TOKEN;

// Palestinian numbers: 05XXXXXXXX → 9725XXXXXXXX
const normalizePhone = (phone) => {
  const p = phone.replace(/[\s\-\(\)\+]/g, '');
  if (p.startsWith('05'))  return '972' + p.substring(1);
  if (p.startsWith('972')) return p;
  return p;
};

const sendMessage = async (to, body) => {
  if (!INSTANCE || !TOKEN) {
    console.log('[WhatsApp] غير مُهيَّأ — تخطي الرسالة إلى', to);
    return;
  }

  const phone   = normalizePhone(to);
  const payload = JSON.stringify({ token: TOKEN, to: phone, body });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.ultramsg.com',
        path: `/${INSTANCE}/messages/chat`,
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// ── تنسيق التاريخ بالعربية ──────────────────────────────────────────────────
const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const formatDateAr = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_AR[m - 1]} ${y}`;
};

// ── تنسيق الوقت 12 ساعة ─────────────────────────────────────────────────────
const formatTimeAr = (timeStr) => {
  const [hStr, mStr] = timeStr.substring(0, 5).split(':');
  const h      = parseInt(hStr);
  const period = h < 12 ? 'ص' : 'م';
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${period}`;
};

// ── رسالة تأكيد الحجز ───────────────────────────────────────────────────────
const sendConfirmation = async ({ customerName, customerPhone, date, startTime, barberName, services, totalPrice, appointmentId }) => {
  const serviceList = services.map((s) => s.name).join(' + ');
  const body =
    `مرحباً ${customerName} 👋\n` +
    `تم تأكيد حجزك في صالون أسيد ✅\n\n` +
    `📅 ${formatDateAr(date)}\n` +
    `⏰ ${formatTimeAr(startTime)}\n` +
    `💈 ${barberName}\n` +
    `✂️ ${serviceList} — ${totalPrice}₪\n\n` +
    `رقم حجزك: #${appointmentId}`;

  try {
    await sendMessage(customerPhone, body);
    console.log(`[WhatsApp] تأكيد أُرسل إلى ${customerPhone}`);
  } catch (err) {
    console.error('[WhatsApp] فشل إرسال التأكيد:', err.message);
  }
};

// ── رسالة تذكير قبل 30 دقيقة ────────────────────────────────────────────────
const sendReminder = async ({ customerName, customerPhone, startTime, barberName }) => {
  const body =
    `تذكير 🔔\n` +
    `موعدك في صالون أسيد بعد 30 دقيقة!\n\n` +
    `⏰ ${formatTimeAr(startTime)}\n` +
    `💈 ${barberName}\n\n` +
    `نراك قريباً ✂️`;

  try {
    await sendMessage(customerPhone, body);
    console.log(`[WhatsApp] تذكير أُرسل إلى ${customerPhone}`);
  } catch (err) {
    console.error('[WhatsApp] فشل إرسال التذكير:', err.message);
  }
};

module.exports = { sendConfirmation, sendReminder };
