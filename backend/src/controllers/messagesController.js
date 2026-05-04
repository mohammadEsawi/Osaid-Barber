const pool = require('../config/database');

const createMessage = async (req, res, next) => {
  try {
    const { sender_name, sender_phone, sender_email, message } = req.body;
    if (!sender_name || !message) {
      return res.status(400).json({ success: false, message: 'الاسم والرسالة مطلوبان' });
    }
    const result = await pool.query(
      `INSERT INTO contact_messages (sender_name, sender_phone, sender_email, message)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [sender_name, sender_phone || null, sender_email || null, message]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { unread_only } = req.query;
    let queryStr = 'SELECT * FROM contact_messages';
    if (unread_only === 'true') queryStr += ' WHERE is_read = false';
    queryStr += ' ORDER BY created_at DESC';

    const [messages, unread] = await Promise.all([
      pool.query(queryStr),
      pool.query('SELECT COUNT(*) FROM contact_messages WHERE is_read = false'),
    ]);

    res.json({
      success: true,
      data: messages.rows,
      unread_count: parseInt(unread.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { createMessage, getMessages, markRead, deleteMessage };
