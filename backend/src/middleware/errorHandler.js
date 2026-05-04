const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'هذا السجل موجود مسبقاً' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'البيانات المرجعية غير موجودة' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ في الخادم';
  res.status(statusCode).json({ success: false, message });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
};

module.exports = { errorHandler, notFound };
