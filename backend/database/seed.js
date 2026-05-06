require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  try {
    const u = new URL(dbUrl);
    u.searchParams.delete('channel_binding');
    u.searchParams.delete('uselibpqcompat');
    dbUrl = u.toString();
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message);
  }
}

const pool = new Pool(
  dbUrl
    ? {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

async function seed() {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash('Admin@123456789', 12);
    console.log('Seeding database...');

    // Admin
    await client.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING
    `, [' أسيد دويكات', 'Osaiddwikat148@gmail.com', '+972515718974', hash, 'admin']);

    // Barbers
    const barberData = [
      { name: 'أسيد دويكات', email: 'osaid@osaidbarber.com', phone: '+972509000001', bio: 'حلاق محترف بخبرة 3 سنوات في تصفيف الشعر وتشكيل اللحى', exp: 8 },
      { name: 'أنس دويكات',  email: 'anas@osaidbarber.com',  phone: '+972509000002', bio: 'متخصص في قصات الشعر العصرية والكلاسيكية مع خبرة 5 سنوات', exp: 5 },
    ];

    for (const b of barberData) {
      const userRes = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'barber') ON CONFLICT (email) DO UPDATE SET full_name=$1 RETURNING id`,
        [b.name, b.email, b.phone, hash]
      );
      const userId = userRes.rows[0].id;
      const barberRes = await client.query(
        `INSERT INTO barbers (user_id, bio, experience_years) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET bio=$2 RETURNING id`,
        [userId, b.bio, b.exp]
      );
      const barberId = barberRes.rows[0].id;
      // Default weekly availability: Sun–Thu 9–21, Fri off, Sat 10–17
      for (let day = 0; day <= 6; day++) {
        const isAvail = day !== 5;
        const start = day === 6 ? '10:00' : '09:00';
        const end   = day === 6 ? '17:00' : '21:00';
        await client.query(
          `INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (barber_id, day_of_week) DO NOTHING`,
          [barberId, day, start, end, isAvail]
        );
      }
    }

    // Services
    const services = [
      ['حلاقة راس ولحية',   'حلاقة الرأس واللحية معاً بأسلوب احترافي', 30, 45],
      ['قص الشعر',          'قص الشعر الاحترافي مع التشطيب والتسريح',  35, 30],
      ['حلاقة اللحية',      'تشكيل وتنسيق اللحية مع الاستحلاق',        20, 15],
      ['قص شعر + لحية',     'باقة كاملة: قص الشعر وحلاقة اللحية',       50, 45],
      ['ماسك الوجه',        'علاج البشرة وتنظيف الوجه العميق',          30, 20],
      ['تسريح الشعر',       'تسريح وتصفيف الشعر للمناسبات',             25, 20],
      ['قص شعر الأطفال',    'قصة شعر للأطفال دون 12 سنة',               20, 25],
      ['الحلاقة الكلاسيكية','حلاقة كلاسيكية بالموسى مع بخار الوجه',     40, 30],
    ];
    for (const [name, desc, price, duration] of services) {
      await client.query(
        `INSERT INTO services (name, description, price, duration_minutes) VALUES ($1,$2,$3,$4) ON CONFLICT (name) DO UPDATE SET price=$3, duration_minutes=$4`,
        [name, desc, price, duration]
      );
    }

    // Products
    const products = [
      ['شامبو للرجال',       'شامبو متخصص للشعر الرجالي مع خلاصة الأرجان',    45, 50, 'عناية بالشعر'],
      ['زيت اللحية',         'زيت طبيعي لترطيب وتلميع اللحية',               55, 30, 'عناية باللحية'],
      ['جل تثبيت الشعر',     'جل احترافي قوي التثبيت',                        35, 40, 'تصفيف الشعر'],
      ['واكس الشعر',         'واكس مرن مع لمعة طبيعية',                       40, 35, 'تصفيف الشعر'],
      ['كريم الحلاقة',       'كريم حلاقة فاخر مع خلاصة الألوة',               30, 45, 'عناية باللحية'],
      ['بلسم ما بعد الحلاقة','بلسم مهدئ لما بعد الحلاقة',                     38, 40, 'عناية باللحية'],
      ['مشط احترافي',        'مشط خشبي متعدد الاستخدامات',                    25, 60, 'أدوات'],
      ['فرشاة اللحية',       'فرشاة احترافية لتطبيق كريم الحلاقة',            65, 25, 'أدوات'],
    ];
    for (const [name, desc, price, stock, cat] of products) {
      await client.query(
        `INSERT INTO products (name, description, price, stock_quantity, category) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET price=$3`,
        [name, desc, price, stock, cat]
      );
    }

    // Settings
    const settingsEntries = [
      ['shop_name','صالون أسيد'],
      ['shop_phone', '+972 515718974'],
      ['shop_email', 'info@osaidbarber.com'],
      ['shop_address', 'بيتا الفوقا - نابلس'],
      ['shop_description', 'صالون حلاقة احترافي يقدم أفضل الخدمات'],
      ['shop_location_url', ''],
      ['stat_1_value', '+2000'], ['stat_1_label', 'عميل سعيد'],
      ['stat_2_value', '10+'],   ['stat_2_label', 'سنوات خبرة'],
      ['stat_3_value', '8'],     ['stat_3_label', 'خدمة متخصصة'],
      ['stat_4_value', '4.9'],   ['stat_4_label', 'تقييم العملاء'],
      ['booking_cancellation_hours', '2'],
      ['slot_duration_minutes', '30'],
    ];
    for (const [key, value] of settingsEntries) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2`,
        [key, value]
      );
    }

    console.log('✅ Seed data inserted successfully.');
    console.log('   Admin  login: admin@osaidbarber.com / Admin@123');
    console.log('   Barber login: osaid@osaidbarber.com / Admin@123');
    console.log('   Barber login: anas@osaidbarber.com  / Admin@123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
