const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, phone, role',
      [full_name, email, phone, password_hash, 'customer']
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getMe = async (req, res) => {
  try {
    let extraData = {};
    if (req.user.role === 'barber') {
      const barberResult = await query('SELECT id, bio, image_url, experience_years FROM barbers WHERE user_id = $1', [req.user.id]);
      if (barberResult.rows.length > 0) extraData.barber = barberResult.rows[0];
    }
    res.json({ success: true, data: { ...req.user, ...extraData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
};
