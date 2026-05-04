const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.user_id, b.bio, b.image_url, b.experience_years, b.is_active,
             u.full_name, u.email, u.phone
      FROM barbers b JOIN users u ON b.user_id = u.id
      WHERE b.is_active = true ORDER BY u.full_name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.user_id, b.bio, b.image_url, b.experience_years, b.is_active,
             u.full_name, u.email, u.phone
      FROM barbers b JOIN users u ON b.user_id = u.id WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الحلاق غير موجود' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { full_name, email, phone, password, bio, experience_years } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });

    const password_hash = await bcrypt.hash(password, 12);
    const userResult = await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [full_name, email, phone, password_hash, 'barber']
    );

    const barberResult = await query(
      'INSERT INTO barbers (user_id, bio, experience_years) VALUES ($1,$2,$3) RETURNING *',
      [userResult.rows[0].id, bio, experience_years]
    );

    // Default availability Mon-Sat 9am-9pm
    const days = [1, 2, 3, 4, 5, 6];
    for (const day of days) {
      await query(
        'INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available) VALUES ($1,$2,$3,$4,$5)',
        [barberResult.rows[0].id, day, '09:00', '21:00', true]
      );
    }

    res.status(201).json({ success: true, message: 'تم إضافة الحلاق بنجاح', data: barberResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { full_name, phone, bio, experience_years, is_active, image_url } = req.body;
    const barberRes = await query('SELECT user_id FROM barbers WHERE id = $1', [req.params.id]);
    if (barberRes.rows.length === 0) return res.status(404).json({ success: false, message: 'الحلاق غير موجود' });

    await query('UPDATE users SET full_name=$1, phone=$2, updated_at=NOW() WHERE id=$3', [full_name, phone, barberRes.rows[0].user_id]);
    const result = await query(
      'UPDATE barbers SET bio=$1, experience_years=$2, is_active=$3, image_url=$4 WHERE id=$5 RETURNING *',
      [bio, experience_years, is_active, image_url, req.params.id]
    );
    res.json({ success: true, message: 'تم تحديث بيانات الحلاق بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.remove = async (req, res) => {
  try {
    const barberRes = await query('SELECT user_id FROM barbers WHERE id = $1', [req.params.id]);
    if (barberRes.rows.length === 0) return res.status(404).json({ success: false, message: 'الحلاق غير موجود' });
    await query('UPDATE barbers SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'تم تعطيل الحلاق بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const result = await query('SELECT * FROM barber_availability WHERE barber_id = $1 ORDER BY day_of_week', [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getUnavailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM barber_unavailable_slots WHERE barber_id = $1';
    const params = [req.params.id];
    if (date) { sql += ' AND unavailable_date = $2'; params.push(date); }
    sql += ' ORDER BY unavailable_date, start_time';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const barberId = req.params.id;

    if (req.user.role === 'barber') {
      const barberCheck = await query('SELECT id FROM barbers WHERE id = $1 AND user_id = $2', [barberId, req.user.id]);
      if (barberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    await query('DELETE FROM barber_availability WHERE barber_id = $1', [barberId]);
    for (const slot of availability) {
      await query(
        'INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available) VALUES ($1,$2,$3,$4,$5)',
        [barberId, slot.day_of_week, slot.start_time, slot.end_time, slot.is_available]
      );
    }
    res.json({ success: true, message: 'تم تحديث أوقات العمل بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.addUnavailableSlot = async (req, res) => {
  try {
    const { unavailable_date, start_time, end_time, reason } = req.body;
    const result = await query(
      'INSERT INTO barber_unavailable_slots (barber_id, unavailable_date, start_time, end_time, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, unavailable_date, start_time, end_time, reason]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.removeUnavailableSlot = async (req, res) => {
  try {
    await query('DELETE FROM barber_unavailable_slots WHERE id = $1 AND barber_id = $2', [req.params.slotId, req.params.id]);
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });

    if (req.user.role === 'barber') {
      const check = await query('SELECT id FROM barbers WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      if (check.rows.length === 0) return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const imageUrl = `/uploads/barbers/${req.file.filename}`;
    await query('UPDATE barbers SET image_url = $1 WHERE id = $2', [imageUrl, req.params.id]);
    res.json({ success: true, data: { image_url: imageUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في رفع الصورة' });
  }
};
