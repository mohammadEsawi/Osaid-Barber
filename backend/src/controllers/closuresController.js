const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await query('SELECT * FROM shop_closures ORDER BY start_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { start_date, end_date, start_time, end_time, reason } = req.body;
    const result = await query(
      'INSERT INTO shop_closures (start_date, end_date, start_time, end_time, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [start_date, end_date, start_time || null, end_time || null, reason || 'إغلاق مؤقت']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM shop_closures WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
