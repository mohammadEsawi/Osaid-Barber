const cron = require('node-cron');
const { query } = require('../config/database');
const { sendReminder } = require('../services/whatsappService');

const runJob = async () => {
  const result = await query(`
    SELECT
      a.id,
      a.customer_name,
      a.customer_phone,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      TO_CHAR(a.start_time, 'HH24:MI')          AS start_time,
      u.full_name                                AS barber_name
    FROM appointments a
    JOIN barbers b ON a.barber_id = b.id
    JOIN users   u ON b.user_id   = u.id
    WHERE a.appointment_date = CURRENT_DATE
      AND a.start_time >= (NOW() + INTERVAL '29 minutes')::TIME
      AND a.start_time <  (NOW() + INTERVAL '31 minutes')::TIME
      AND a.status IN ('pending', 'confirmed')
      AND a.reminder_sent = FALSE
  `);

  for (const appt of result.rows) {
    await sendReminder({
      customerName:  appt.customer_name,
      customerPhone: appt.customer_phone,
      startTime:     appt.start_time,
      barberName:    appt.barber_name,
    });
    await query('UPDATE appointments SET reminder_sent = TRUE WHERE id = $1', [appt.id]);
  }
};

const startReminderJob = async () => {
  // يعمل كل 5 دقائق للتوفير في compute time
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runJob();
    } catch (err) {
      console.error('[ReminderJob] خطأ:', err.message);
    }
  });

  console.log('[ReminderJob] ✅ يعمل — يفحص كل 5 دقائق عن مواعيد بعد 30 دقيقة');
};

module.exports = { startReminderJob };
