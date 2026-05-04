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

/**
 * Check if a time slot is available for a barber.
 * Returns { available: bool, conflictingAppointment?, nextAvailableSlot? }
 */
const checkSlotAvailability = async (barberId, date, startTime, durationMinutes, excludeAppointmentId = null) => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;
  const endTime = minutesToTime(endMins);

  // 1. Check barber's weekly availability
  const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat
  const availResult = await query(
    'SELECT * FROM barber_availability WHERE barber_id = $1 AND day_of_week = $2 AND is_available = true',
    [barberId, dayOfWeek]
  );
  if (availResult.rows.length === 0) {
    return { available: false, reason: 'الحلاق غير متاح في هذا اليوم' };
  }

  const workSlot = availResult.rows[0];
  if (startTime < workSlot.start_time || endTime > workSlot.end_time) {
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
const findNextAvailableSlot = async (barberId, date, afterTime, durationMinutes, workEndTime, step = 30) => {
  let currentMins = timeToMinutes(afterTime);
  const workEndMins = timeToMinutes(workEndTime);

  while (currentMins + durationMinutes <= workEndMins) {
    const candidateTime = minutesToTime(currentMins);
    const result = await checkSlotAvailability(barberId, date, candidateTime, durationMinutes);
    if (result.available) return candidateTime;
    currentMins += step;
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
 */
const getAvailableSlots = async (barberId, date, durationMinutes, step = 30) => {
  const dayOfWeek = new Date(date).getDay();
  const availResult = await query(
    'SELECT * FROM barber_availability WHERE barber_id = $1 AND day_of_week = $2 AND is_available = true',
    [barberId, dayOfWeek]
  );
  if (availResult.rows.length === 0) return [];

  const workSlot = availResult.rows[0];
  const slots = [];
  let currentMins = timeToMinutes(workSlot.start_time);
  const endMins = timeToMinutes(workSlot.end_time);

  while (currentMins + durationMinutes <= endMins) {
    const candidateTime = minutesToTime(currentMins);
    const result = await checkSlotAvailability(barberId, date, candidateTime, durationMinutes);
    slots.push({ time: candidateTime, available: result.available });
    currentMins += step;
  }
  return slots;
};

module.exports = { checkSlotAvailability, findNextAvailableSlot, getBookedSlots, getAvailableSlots, timeToMinutes, minutesToTime };
