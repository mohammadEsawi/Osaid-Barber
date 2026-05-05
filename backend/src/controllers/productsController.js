const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { search, category, active_only } = req.query;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (active_only === 'true') { conditions.push('is_active = true'); }
    if (search) { conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (category) { conditions.push(`category = $${idx++}`); params.push(category); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await query(`SELECT * FROM products ${where} ORDER BY name`, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, image_url, category } = req.body;
    const result = await query(
      'INSERT INTO products (name, description, price, stock_quantity, image_url, category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, price, stock_quantity, image_url, category]
    );
    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, image_url, category, is_active } = req.body;
    const result = await query(
      'UPDATE products SET name=$1, description=$2, price=$3, stock_quantity=$4, image_url=$5, category=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, price, stock_quantity, image_url, category, is_active ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, message: 'تم تحديث المنتج بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
  res.json({ success: true, data: { image_url: `/uploads/products/${req.file.filename}` } });
};
