const { query } = require('../config/database');
const { checkSlotAvailability, getAvailableSlots, minutesToTime, timeToMinutes } = require('../services/bookingService');
const { sendConfirmation } = require('../services/whatsappService');

exports.getAll = async (req, res) => {
  try {
    const { status, date, barber_id, exclude_status, page = 1, limit = 200 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (req.user.role === 'barber') {
      const barberRes = await query('SELECT id FROM barbers WHERE user_id = $1', [req.user.id]);
      if (barberRes.rows.length === 0) return res.status(403).json({ success: false, message: 'غير مصرح' });
      conditions.push(`a.barber_id = $${idx++}`);
      params.push(barberRes.rows[0].id);
    } else if (barber_id) {
      conditions.push(`a.barber_id = $${idx++}`);
      params.push(barber_id);
    }

    if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }
    if (exclude_status) { conditions.push(`a.status != $${idx++}`); params.push(exclude_status); }
    if (date) { conditions.push(`a.appointment_date = $${idx++}`); params.push(date); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(`SELECT COUNT(*) FROM appointments a ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(`
      SELECT a.id, a.customer_name, a.customer_phone, a.barber_id,
             TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
             TO_CHAR(a.start_time, 'HH24:MI') as start_time,
             TO_CHAR(a.end_time, 'HH24:MI') as end_time,
             a.total_duration, a.total_price, a.status, a.notes, a.created_at,
             b.id as barber_db_id, u.full_name as barber_name,
             COALESCE(json_agg(json_build_object('id',s.id,'name',s.name,'price',aps.price_at_booking,'duration',aps.duration_at_booking)) FILTER (WHERE s.id IS NOT NULL), '[]') as services
      FROM appointments a
      LEFT JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      ${where}
      GROUP BY a.id, b.id, u.full_name
      ORDER BY a.appointment_date ASC, a.start_time ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    res.json({ success: true, data: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.customer_name, a.customer_phone, a.barber_id,
             TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
             TO_CHAR(a.start_time, 'HH24:MI') as start_time,
             TO_CHAR(a.end_time, 'HH24:MI') as end_time,
             a.total_duration, a.total_price, a.status, a.notes, a.created_at,
             u.full_name as barber_name,
             COALESCE(json_agg(json_build_object('id',s.id,'name',s.name,'price',aps.price_at_booking,'duration',aps.duration_at_booking)) FILTER (WHERE s.id IS NOT NULL), '[]') as services
      FROM appointments a
      LEFT JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      WHERE a.id = $1 GROUP BY a.id, u.full_name
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { customer_name, customer_phone, barber_id, appointment_date, start_time, service_ids, notes } = req.body;

    // Fetch services
    const serviceResult = await query(
      `SELECT id, name, price, duration_minutes FROM services WHERE id = ANY($1) AND is_active = true`,
      [service_ids]
    );
    if (serviceResult.rows.length !== service_ids.length) {
      return res.status(400).json({ success: false, message: 'بعض الخدمات المختارة غير متاحة' });
    }

    const totalDuration = serviceResult.rows.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalPrice = serviceResult.rows.reduce((sum, s) => sum + parseFloat(s.price), 0);
    const endMins = timeToMinutes(start_time) + totalDuration;
    const end_time = minutesToTime(endMins);

    // Check availability
    const availability = await checkSlotAvailability(barber_id, appointment_date, start_time, totalDuration);
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.reason,
        nextAvailableSlot: availability.nextAvailableSlot,
      });
    }

    // Create appointment
    const apptResult = await query(
      `INSERT INTO appointments (customer_name, customer_phone, barber_id, appointment_date, start_time, end_time, total_duration, total_price, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *`,
      [customer_name, customer_phone, barber_id, appointment_date, start_time, end_time, totalDuration, totalPrice, notes]
    );
    const appt = apptResult.rows[0];

    // Insert appointment services
    for (const service of serviceResult.rows) {
      await query(
        'INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_at_booking) VALUES ($1,$2,$3,$4)',
        [appt.id, service.id, service.price, service.duration_minutes]
      );
    }

    res.status(201).json({ success: true, message: 'تم حجز الموعد بنجاح', data: appt });

    // إرسال تأكيد WhatsApp (fire-and-forget — لا يؤثر على الاستجابة)
    const barberRes = await query(
      'SELECT u.full_name FROM barbers b JOIN users u ON b.user_id = u.id WHERE b.id = $1',
      [barber_id]
    );
    sendConfirmation({
      customerName:  customer_name,
      customerPhone: customer_phone,
      date:          appointment_date,
      startTime:     start_time,
      barberName:    barberRes.rows[0]?.full_name || '',
      services:      serviceResult.rows,
      totalPrice,
      appointmentId: appt.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { appointment_date, start_time, barber_id, notes } = req.body;
    const existing = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });

    const appt = existing.rows[0];
    const newDate = appointment_date || appt.appointment_date;
    const newStart = start_time || appt.start_time;
    const newBarber = barber_id || appt.barber_id;

    if (appointment_date || start_time) {
      const availability = await checkSlotAvailability(newBarber, newDate, newStart, appt.total_duration, req.params.id);
      if (!availability.available) {
        return res.status(409).json({ success: false, message: availability.reason, nextAvailableSlot: availability.nextAvailableSlot });
      }
    }

    const endMins = timeToMinutes(newStart) + appt.total_duration;
    const end_time = minutesToTime(endMins);

    const result = await query(
      'UPDATE appointments SET appointment_date=$1, start_time=$2, end_time=$3, barber_id=$4, notes=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [newDate, newStart, end_time, newBarber, notes || appt.notes, req.params.id]
    );
    res.json({ success: true, message: 'تم تحديث الموعد بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'حالة غير صالحة' });

    const result = await query(
      'UPDATE appointments SET status=$1, notes=COALESCE($2, notes), updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, message: 'تم تحديث حالة الموعد', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM appointment_services WHERE appointment_id = $1', [req.params.id]);
    const result = await query('DELETE FROM appointments WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, message: 'تم حذف الموعد بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { barber_id, date, duration } = req.query;
    if (!barber_id || !date || !duration) {
      return res.status(400).json({ success: false, message: 'barber_id, date, و duration مطلوبة' });
    }
    const slots = await getAvailableSlots(parseInt(barber_id), date, parseInt(duration));
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });

    const result = await query(`
      SELECT a.id, a.customer_name, a.customer_phone, a.barber_id,
             TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
             TO_CHAR(a.start_time, 'HH24:MI') as start_time,
             TO_CHAR(a.end_time, 'HH24:MI') as end_time,
             a.total_duration, a.total_price, a.status, a.notes, a.created_at,
             u.full_name as barber_name,
             COALESCE(json_agg(json_build_object('id',s.id,'name',s.name,'price',aps.price_at_booking)) FILTER (WHERE s.id IS NOT NULL), '[]') as services
      FROM appointments a
      LEFT JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      WHERE a.customer_phone = $1
      GROUP BY a.id, u.full_name ORDER BY a.appointment_date ASC, a.start_time ASC
    `, [phone]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.cancelByPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const appt = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (appt.rows.length === 0) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    if (appt.rows[0].customer_phone !== phone) return res.status(403).json({ success: false, message: 'غير مصرح لك بإلغاء هذا الموعد' });
    if (appt.rows[0].status === 'completed') return res.status(400).json({ success: false, message: 'لا يمكن إلغاء موعد مكتمل' });

    await query('UPDATE appointments SET status = $1, updated_at=NOW() WHERE id = $2', ['cancelled', req.params.id]);
    res.json({ success: true, message: 'تم إلغاء الموعد بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
