const { query } = require('../config/database');

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Parse YYYY-MM-DD without timezone shift
const parseDateLocal = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getSlotStep = async () => {
  const result = await query("SELECT value FROM settings WHERE key = 'slot_duration_minutes'");
  return result.rows.length > 0 ? parseInt(result.rows[0].value) || 30 : 30;
};

/**
 * Check if a time slot is available for a barber.
 * Returns { available: bool, conflictingAppointment?, nextAvailableSlot? }
 */
const checkSlotAvailability = async (barberId, date, startTime, durationMinutes, excludeAppointmentId = null) => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;
  const endTime = minutesToTime(endMins);

  // 1. Check barber's weekly availability
  const dayOfWeek = parseDateLocal(date).getDay(); // 0=Sun, 6=Sat
  const availResult = await query(
    'SELECT * FROM barber_availability WHERE barber_id = $1 AND day_of_week = $2 AND is_available = true',
    [barberId, dayOfWeek]
  );
  if (availResult.rows.length === 0) {
    return { available: false, reason: 'الحلاق غير متاح في هذا اليوم' };
  }

  const workSlot = availResult.rows[0];
  const workStartMins = timeToMinutes(workSlot.start_time);
  const workEndMins = timeToMinutes(workSlot.end_time);
  if (startMins < workStartMins || endMins > workEndMins) {
    return { available: false, reason: 'الوقت المطلوب خارج ساعات العمل' };
  }

  // 2. Check unavailable slots
  const unavailResult = await query(
    `SELECT * FROM barber_unavailable_slots
     WHERE barber_id = $1 AND unavailable_date = $2
       AND NOT (end_time <= $3 OR start_time >= $4)`,
    [barberId, date, startTime, endTime]
  );
  if (unavailResult.rows.length > 0) {
    return { available: false, reason: 'الحلاق غير متاح في هذا الوقت' };
  }

  // 2b. Check daily break time
  const breakRes = await query(
    "SELECT key, value FROM settings WHERE key IN ('shop_break_start', 'shop_break_end')"
  );
  const bMap = {};
  for (const r of breakRes.rows) bMap[r.key] = r.value;
  if (bMap['shop_break_start'] && bMap['shop_break_end']) {
    const bStart = timeToMinutes(bMap['shop_break_start']);
    const bEnd   = timeToMinutes(bMap['shop_break_end']);
    if (!(endMins <= bStart || startMins >= bEnd)) {
      return { available: false, reason: 'الصالون في وقت الاستراحة' };
    }
  }

  // 3. Check existing appointments
  let conflictQuery = `
    SELECT id, start_time, end_time, customer_name
    FROM appointments
    WHERE barber_id = $1 AND appointment_date = $2
      AND status NOT IN ('cancelled', 'no_show')
      AND NOT (end_time <= $3 OR start_time >= $4)
  `;
  const params = [barberId, date, startTime, endTime];
  if (excludeAppointmentId) {
    conflictQuery += ` AND id != $5`;
    params.push(excludeAppointmentId);
  }

  const conflictResult = await query(conflictQuery, params);
  if (conflictResult.rows.length > 0) {
    const conflict = conflictResult.rows[0];
    const nextSlot = await findNextAvailableSlot(barberId, date, conflict.end_time, durationMinutes, workSlot.end_time);
    return {
      available: false,
      reason: 'هذا الوقت محجوز مسبقاً',
      conflict,
      nextAvailableSlot: nextSlot,
    };
  }

  return { available: true, startTime, endTime };
};

/**
 * Find the next available slot after a given time, within the same day.
 */
const findNextAvailableSlot = async (barberId, date, afterTime, durationMinutes, workEndTime) => {
  let currentMins = timeToMinutes(afterTime);
  const workEndMins = timeToMinutes(workEndTime);

  while (currentMins + durationMinutes <= workEndMins) {
    const candidateTime = minutesToTime(currentMins);
    const result = await checkSlotAvailability(barberId, date, candidateTime, durationMinutes);
    if (result.available) return candidateTime;
    currentMins += durationMinutes;
  }
  return null;
};

/**
 * Get all booked slots for a barber on a specific date, plus unavailable slots.
 */
const getBookedSlots = async (barberId, date) => {
  const appointments = await query(
    `SELECT start_time, end_time FROM appointments
     WHERE barber_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled','no_show')
     ORDER BY start_time`,
    [barberId, date]
  );
  const unavailable = await query(
    `SELECT start_time, end_time FROM barber_unavailable_slots
     WHERE barber_id = $1 AND unavailable_date = $2`,
    [barberId, date]
  );
  return { appointments: appointments.rows, unavailableSlots: unavailable.rows };
};

/**
 * Generate all available time slots for a barber on a given date.
 * Uses 4 DB queries total regardless of slot count (previously O(n×3) queries).
 */
const getAvailableSlots = async (barberId, date, durationMinutes) => {
  const dayOfWeek = parseDateLocal(date).getDay();

  // Query 1: work hours for the day
  const availResult = await query(
    `SELECT TO_CHAR(start_time,'HH24:MI') AS start_time, TO_CHAR(end_time,'HH24:MI') AS end_time
     FROM barber_availability WHERE barber_id = $1 AND day_of_week = $2 AND is_available = true`,
    [barberId, dayOfWeek]
  );
  if (availResult.rows.length === 0) return [];

  // Query 2: all booked appointments for the day
  const apptResult = await query(
    `SELECT TO_CHAR(start_time,'HH24:MI') AS start_time, TO_CHAR(end_time,'HH24:MI') AS end_time
     FROM appointments
     WHERE barber_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled','no_show')`,
    [barberId, date]
  );

  // Query 3: all unavailable slots for the day
  const unavailResult = await query(
    `SELECT TO_CHAR(start_time,'HH24:MI') AS start_time, TO_CHAR(end_time,'HH24:MI') AS end_time
     FROM barber_unavailable_slots WHERE barber_id = $1 AND unavailable_date = $2`,
    [barberId, date]
  );

  // Query 4: break time settings
  const breakResult = await query(
    "SELECT key, value FROM settings WHERE key IN ('shop_break_start', 'shop_break_end')"
  );
  const breakMap = {};
  for (const r of breakResult.rows) breakMap[r.key] = r.value;
  const breakStart = breakMap['shop_break_start'] ? timeToMinutes(breakMap['shop_break_start']) : null;
  const breakEnd   = breakMap['shop_break_end']   ? timeToMinutes(breakMap['shop_break_end'])   : null;

  const workSlot = availResult.rows[0];
  const workStartMins = timeToMinutes(workSlot.start_time);
  const workEndMins = timeToMinutes(workSlot.end_time);
  const bookedAppts = apptResult.rows;
  const unavailSlots = unavailResult.rows;

  // Check slot availability in memory — no more per-slot DB queries
  const isBlocked = (slotStart, slotEnd) => {
    for (const a of bookedAppts) {
      const as = timeToMinutes(a.start_time);
      const ae = timeToMinutes(a.end_time);
      if (!(slotEnd <= as || slotStart >= ae)) return true;
    }
    for (const u of unavailSlots) {
      const us = timeToMinutes(u.start_time);
      const ue = timeToMinutes(u.end_time);
      if (!(slotEnd <= us || slotStart >= ue)) return true;
    }
    if (breakStart !== null && breakEnd !== null) {
      if (!(slotEnd <= breakStart || slotStart >= breakEnd)) return true;
    }
    return false;
  };

  // Step = duration of the requested service (dynamic per booking type)
  const slots = [];
  let currentMins = workStartMins;
  while (currentMins + durationMinutes <= workEndMins) {
    const slotEnd = currentMins + durationMinutes;
    slots.push({ time: minutesToTime(currentMins), available: !isBlocked(currentMins, slotEnd) });
    currentMins += durationMinutes;
  }
  return slots;
};

module.exports = { checkSlotAvailability, findNextAvailableSlot, getBookedSlots, getAvailableSlots, timeToMinutes, minutesToTime };
