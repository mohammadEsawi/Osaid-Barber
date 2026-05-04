-- Seed data for Osaid Barber Shop
-- Password for all users: Admin@123 (hashed with bcrypt rounds=12)
-- Run AFTER schema.sql

\c osaid_barber;

-- Admin user (password: Admin@123)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
  ('أحمد الأدمن', 'admin@osaidbarber.com', '+966501234567', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeuFm7YKDjnKfcv2i', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Barber users (password: Admin@123)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
  ('خالد العمري', 'khaled@osaidbarber.com', '+966502345678', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeuFm7YKDjnKfcv2i', 'barber'),
  ('محمد السعيد', 'mohammed@osaidbarber.com', '+966503456789', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeuFm7YKDjnKfcv2i', 'barber'),
  ('عمر الراشد', 'omar@osaidbarber.com', '+966504567890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeuFm7YKDjnKfcv2i', 'barber')
ON CONFLICT (email) DO NOTHING;

-- Barber profiles
INSERT INTO barbers (user_id, bio, experience_years, is_active) VALUES
  ((SELECT id FROM users WHERE email='khaled@osaidbarber.com'), 'حلاق محترف بخبرة 8 سنوات في تصفيف الشعر وتشكيل اللحى', 8, true),
  ((SELECT id FROM users WHERE email='mohammed@osaidbarber.com'), 'متخصص في قصات الشعر العصرية والكلاسيكية مع خبرة 5 سنوات', 5, true),
  ((SELECT id FROM users WHERE email='omar@osaidbarber.com'), 'خبير في علاج الشعر والعناية بالبشرة مع خبرة 3 سنوات', 3, true)
ON CONFLICT DO NOTHING;

-- Barber weekly availability (Sun=0, Sat=6 — working Sat-Thu 9am-9pm)
DO $$
DECLARE
  b RECORD;
  d INTEGER;
BEGIN
  FOR b IN SELECT id FROM barbers LOOP
    FOR d IN 0..4 LOOP  -- Sun(0) to Thu(4)
      INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
      VALUES (b.id, d, '09:00', '21:00', true)
      ON CONFLICT (barber_id, day_of_week) DO NOTHING;
    END LOOP;
    -- Friday off
    INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
    VALUES (b.id, 5, '09:00', '21:00', false)
    ON CONFLICT (barber_id, day_of_week) DO NOTHING;
    -- Saturday half day
    INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
    VALUES (b.id, 6, '10:00', '17:00', true)
    ON CONFLICT (barber_id, day_of_week) DO NOTHING;
  END LOOP;
END $$;

-- Services
INSERT INTO services (name, description, price, duration_minutes, is_active) VALUES
  ('قص الشعر', 'قص الشعر الاحترافي مع التشطيب والتسريح', 35.00, 30, true),
  ('حلاقة اللحية', 'تشكيل وتنسيق اللحية مع الاستحلاق', 20.00, 15, true),
  ('قص شعر + لحية', 'باقة كاملة: قص الشعر وحلاقة اللحية', 50.00, 45, true),
  ('ماسك الوجه', 'علاج البشرة وتنظيف الوجه العميق', 30.00, 20, true),
  ('تسريح الشعر', 'تسريح وتصفيف الشعر للمناسبات', 25.00, 20, true),
  ('قص شعر الأطفال', 'قصة شعر للأطفال دون 12 سنة', 20.00, 25, true),
  ('علاج الكيراتين', 'علاج الكيراتين لتنعيم الشعر', 150.00, 90, true),
  ('الحلاقة الكلاسيكية', 'حلاقة كلاسيكية بالموسى مع بخار الوجه', 40.00, 30, true)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (name, description, price, stock_quantity, category, is_active) VALUES
  ('شامبو للرجال', 'شامبو متخصص للشعر الرجالي مع خلاصة الأرجان', 45.00, 50, 'عناية بالشعر', true),
  ('زيت اللحية', 'زيت طبيعي لترطيب وتلميع اللحية', 55.00, 30, 'عناية باللحية', true),
  ('جل تثبيت الشعر', 'جل احترافي قوي التثبيت', 35.00, 40, 'تصفيف الشعر', true),
  ('واكس الشعر', 'واكس مرن مع لمعة طبيعية', 40.00, 35, 'تصفيف الشعر', true),
  ('كريم الحلاقة', 'كريم حلاقة فاخر مع خلاصة الألوة', 30.00, 45, 'عناية باللحية', true),
  ('بلسم ما بعد الحلاقة', 'بلسم مهدئ لما بعد الحلاقة', 38.00, 40, 'عناية باللحية', true),
  ('مشط احترافي', 'مشط خشبي متعدد الاستخدامات', 25.00, 60, 'أدوات', true),
  ('فرشاة اللحية', 'فرشاة احترافية لتطبيق كريم الحلاقة', 65.00, 25, 'أدوات', true)
ON CONFLICT DO NOTHING;
