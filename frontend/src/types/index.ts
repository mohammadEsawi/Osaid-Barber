export type Role = 'admin' | 'barber' | 'customer';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  barber?: BarberProfile;
}

export interface BarberProfile {
  id: number;
  user_id: number;
  bio: string;
  image_url: string;
  experience_years: number;
  is_active: boolean;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: number;
  customer_name: string;
  customer_phone: string;
  barber_id: number;
  barber_name?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  total_price: number;
  status: AppointmentStatus;
  notes: string;
  services: AppointmentService[];
  created_at: string;
}

export interface AppointmentService {
  id: number;
  name: string;
  price: number;
  duration: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  status: OrderStatus;
  notes: string;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

export interface BarberAvailability {
  id: number;
  barber_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DashboardStats {
  todayAppointments: number;
  monthAppointments: number;
  totalIncome: number;
  pendingAppointments: number;
  activeBarbers: number;
  totalProducts: number;
  totalOrders: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show: 'bg-zinc-500/20 text-zinc-400',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};
