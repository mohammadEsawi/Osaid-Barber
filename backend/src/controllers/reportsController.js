const { query } = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const [todayAppts, monthAppts, totalIncome, pendingAppts, activeBarbers, totalProducts, totalOrders] = await Promise.all([
      query(`SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND status NOT IN ('cancelled','no_show')`, [today]),
      query(`SELECT COUNT(*) FROM appointments WHERE TO_CHAR(appointment_date,'YYYY-MM') = $1 AND status NOT IN ('cancelled','no_show')`, [thisMonth]),
      query(`SELECT COALESCE(SUM(total_price),0) as total FROM appointments WHERE status = 'completed'`),
      query(`SELECT COUNT(*) FROM appointments WHERE status = 'pending'`),
      query(`SELECT COUNT(*) FROM barbers WHERE is_active = true`),
      query(`SELECT COUNT(*) FROM products WHERE is_active = true`),
      query(`SELECT COUNT(*) FROM product_orders WHERE status != 'cancelled'`),
    ]);

    const upcomingAppts = await query(`
      SELECT a.*, u.full_name as barber_name
      FROM appointments a LEFT JOIN barbers b ON a.barber_id = b.id LEFT JOIN users u ON b.user_id = u.id
      WHERE a.appointment_date = $1 AND a.status NOT IN ('cancelled','no_show')
      ORDER BY a.start_time LIMIT 10
    `, [today]);

    res.json({
      success: true,
      data: {
        stats: {
          todayAppointments: parseInt(todayAppts.rows[0].count),
          monthAppointments: parseInt(monthAppts.rows[0].count),
          totalIncome: parseFloat(totalIncome.rows[0].total),
          pendingAppointments: parseInt(pendingAppts.rows[0].count),
          activeBarbers: parseInt(activeBarbers.rows[0].count),
          totalProducts: parseInt(totalProducts.rows[0].count),
          totalOrders: parseInt(totalOrders.rows[0].count),
        },
        upcomingAppointments: upcomingAppts.rows,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getBookingsReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [];
    let dateFilter = '';
    if (from && to) { dateFilter = 'WHERE appointment_date BETWEEN $1 AND $2'; params.push(from, to); }

    const [statusDist, dailyBookings, servicePopularity] = await Promise.all([
      query(`SELECT status, COUNT(*) as count FROM appointments ${dateFilter} GROUP BY status`, params),
      query(`SELECT appointment_date, COUNT(*) as count FROM appointments ${dateFilter} GROUP BY appointment_date ORDER BY appointment_date`, params),
      query(`
        SELECT s.name, COUNT(aps.service_id) as booking_count, SUM(aps.price_at_booking) as total_revenue
        FROM appointment_services aps JOIN services s ON aps.service_id = s.id
        JOIN appointments a ON aps.appointment_id = a.id
        ${dateFilter.replace('appointment_date', 'a.appointment_date')}
        GROUP BY s.name ORDER BY booking_count DESC LIMIT 10
      `, params),
    ]);

    res.json({ success: true, data: { statusDistribution: statusDist.rows, dailyBookings: dailyBookings.rows, servicePopularity: servicePopularity.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getIncomeReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const monthlyIncome = await query(`
      SELECT TO_CHAR(appointment_date,'YYYY-MM') as month, SUM(total_price) as income, COUNT(*) as appointments
      FROM appointments WHERE status = 'completed' AND EXTRACT(YEAR FROM appointment_date) = $1
      GROUP BY month ORDER BY month
    `, [targetYear]);

    const orderIncome = await query(`
      SELECT TO_CHAR(created_at,'YYYY-MM') as month, SUM(total_price) as income, COUNT(*) as orders
      FROM product_orders WHERE status = 'delivered' AND EXTRACT(YEAR FROM created_at) = $1
      GROUP BY month ORDER BY month
    `, [targetYear]);

    res.json({ success: true, data: { appointmentIncome: monthlyIncome.rows, orderIncome: orderIncome.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getProductsReport = async (req, res) => {
  try {
    const topSelling = await query(`
      SELECT p.name, p.category, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_at_order) as revenue
      FROM product_order_items oi JOIN products p ON oi.product_id = p.id
      JOIN product_orders o ON oi.order_id = o.id WHERE o.status = 'delivered'
      GROUP BY p.id ORDER BY total_sold DESC LIMIT 10
    `);

    const lowStock = await query(`SELECT * FROM products WHERE stock_quantity < 10 AND is_active = true ORDER BY stock_quantity`);

    res.json({ success: true, data: { topSelling: topSelling.rows, lowStock: lowStock.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getBarbersReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [];
    let dateFilter = '';
    if (from && to) { dateFilter = 'AND a.appointment_date BETWEEN $1 AND $2'; params.push(from, to); }

    const barberPerf = await query(`
      SELECT u.full_name as barber_name, b.id as barber_id,
             COUNT(a.id) as total_appointments,
             COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
             COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.total_price END), 0) as total_income
      FROM barbers b JOIN users u ON b.user_id = u.id
      LEFT JOIN appointments a ON b.id = a.barber_id ${dateFilter}
      WHERE b.is_active = true
      GROUP BY b.id, u.full_name ORDER BY total_income DESC
    `, params);

    res.json({ success: true, data: barberPerf.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
