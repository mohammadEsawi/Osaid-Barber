const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT o.*, COALESCE(json_agg(json_build_object('id',p.id,'name',p.name,'quantity',oi.quantity,'price',oi.price_at_order)) FILTER (WHERE p.id IS NOT NULL),'[]') as items
      FROM product_orders o
      LEFT JOIN product_order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;
    const params = [];
    if (status) { sql += ' WHERE o.status = $1'; params.push(status); }
    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, COALESCE(json_agg(json_build_object('id',p.id,'name',p.name,'quantity',oi.quantity,'price',oi.price_at_order,'image_url',p.image_url)) FILTER (WHERE p.id IS NOT NULL),'[]') as items
      FROM product_orders o
      LEFT JOIN product_order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 GROUP BY o.id
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { customer_name, customer_phone, items, notes } = req.body;

    // Validate stock and calculate total
    let totalPrice = 0;
    const productData = [];
    for (const item of items) {
      const pResult = await query('SELECT * FROM products WHERE id = $1 AND is_active = true', [item.product_id]);
      if (pResult.rows.length === 0) return res.status(400).json({ success: false, message: `المنتج ${item.product_id} غير موجود` });
      const product = pResult.rows[0];
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `الكمية المطلوبة من "${product.name}" غير متوفرة في المخزون` });
      }
      totalPrice += parseFloat(product.price) * item.quantity;
      productData.push({ ...item, price: product.price, name: product.name });
    }

    const orderResult = await query(
      'INSERT INTO product_orders (customer_name, customer_phone, total_price, notes) VALUES ($1,$2,$3,$4) RETURNING *',
      [customer_name, customer_phone, totalPrice, notes]
    );
    const order = orderResult.rows[0];

    for (const item of productData) {
      await query(
        'INSERT INTO product_order_items (order_id, product_id, quantity, price_at_order) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'حالة غير صالحة' });

    // Restore stock on cancel
    if (status === 'cancelled') {
      const items = await query('SELECT * FROM product_order_items WHERE order_id = $1', [req.params.id]);
      for (const item of items.rows) {
        await query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    const result = await query('UPDATE product_orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, message: 'تم تحديث حالة الطلب', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
