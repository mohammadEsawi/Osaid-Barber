const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { active_only } = req.query;
    let sql = 'SELECT * FROM services';
    const params = [];
    if (active_only === 'true') { sql += ' WHERE is_active = true'; }
    sql += ' ORDER BY name';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, duration_minutes, image_url } = req.body;
    const result = await query(
      'INSERT INTO services (name, description, price, duration_minutes, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, price, duration_minutes, image_url]
    );
    res.status(201).json({ success: true, message: 'تم إضافة الخدمة بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, duration_minutes, image_url, is_active } = req.body;
    const result = await query(
      'UPDATE services SET name=$1, description=$2, price=$3, duration_minutes=$4, image_url=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, price, duration_minutes, image_url, is_active ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    res.json({ success: true, message: 'تم تحديث الخدمة بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
