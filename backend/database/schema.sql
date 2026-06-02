-- Osaid Barber Shop - PostgreSQL Database Schema
-- Run: psql -U postgres -d osaid_barber -f schema.sql

CREATE DATABASE osaid_barber;
\c osaid_barber;

-- Enable UUID extension (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','barber','customer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- BARBERS
-- =====================
CREATE TABLE IF NOT EXISTS barbers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  image_url VARCHAR(500),
  experience_years INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- SERVICES
-- =====================
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- APPOINTMENTS
-- =====================
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  barber_id INTEGER NOT NULL REFERENCES barbers(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_duration INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =====================
-- APPOINTMENT SERVICES (junction)
-- =====================
CREATE TABLE IF NOT EXISTS appointment_services (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  price_at_booking DECIMAL(10,2) NOT NULL,
  duration_at_booking INTEGER NOT NULL
);

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- PRODUCT ORDERS
-- =====================
CREATE TABLE IF NOT EXISTS product_orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivered','cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- PRODUCT ORDER ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS product_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES product_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_order DECIMAL(10,2) NOT NULL
);

-- =====================
-- BARBER AVAILABILITY (weekly schedule)
-- =====================
CREATE TABLE IF NOT EXISTS barber_availability (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(barber_id, day_of_week)
);

-- =====================
-- BARBER UNAVAILABLE SLOTS (specific dates/times off)
-- =====================
CREATE TABLE IF NOT EXISTS barber_unavailable_slots (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255)
);

-- =====================
-- SETTINGS
-- =====================
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- CONTACT MESSAGES
-- =====================
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  sender_name VARCHAR(150) NOT NULL,
  sender_phone VARCHAR(20),
  sender_email VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);

-- Unique indexes required for seed ON CONFLICT clauses
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('shop_name', 'أوسيد باربر'),
  ('shop_phone', '+972 515718974'),
  ('shop_address', 'بيتا الفوقا - نابلس'),
  ('shop_email', 'info@osaidbarber.com'),
  ('shop_location_url', ''),
  ('booking_cancellation_hours', '2'),
  ('slot_duration_minutes', '30'),
  ('shop_description', 'صالون حلاقة احترافي يقدم أفضل الخدمات'),
  ('stat_1_value', '+2000'),
  ('stat_1_label', 'عميل سعيد'),
  ('stat_2_value', '10+'),
  ('stat_2_label', 'سنوات خبرة'),
  ('stat_3_value', '8'),
  ('stat_3_label', 'خدمة متخصصة'),
  ('stat_4_value', '4.9'),
  ('stat_4_label', 'تقييم العملاء')
ON CONFLICT (key) DO NOTHING;

-- Migrations
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_child BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
