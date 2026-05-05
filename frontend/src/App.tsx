import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Public pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import BarbersPage from './pages/public/BarbersPage';
import BookingPage from './pages/public/BookingPage';
import BookingConfirmationPage from './pages/public/BookingConfirmationPage';
import MyBookingPage from './pages/public/MyBookingPage';
import StorePage from './pages/public/StorePage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import CartPage from './pages/public/CartPage';
import ContactPage from './pages/public/ContactPage';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminServices from './pages/admin/AdminServices';
import AdminBarbers from './pages/admin/AdminBarbers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMessages from './pages/admin/AdminMessages';

// Barber
import BarberDashboard from './pages/barber/BarberDashboard';
import BarberAppointments from './pages/barber/BarberAppointments';
import BarberCalendar from './pages/barber/BarberCalendar';
import BarberAvailability from './pages/barber/BarberAvailability';
import BarberProfile from './pages/barber/BarberProfile';

import LoadingSpinner from './components/ui/LoadingSpinner';

const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles: string[] }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/barbers" element={<BarbersPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
      <Route path="/my-booking" element={<MyBookingPage />} />
      <Route path="/store" element={<StorePage />} />
      <Route path="/store/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/barber'} /> : <LoginPage />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute roles={['admin']}><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/barbers" element={<ProtectedRoute roles={['admin']}><AdminBarbers /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute roles={['admin']}><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><AdminMessages /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

      {/* Barber */}
      <Route path="/barber" element={<ProtectedRoute roles={['barber']}><BarberDashboard /></ProtectedRoute>} />
      <Route path="/barber/appointments" element={<ProtectedRoute roles={['barber']}><BarberAppointments /></ProtectedRoute>} />
      <Route path="/barber/calendar" element={<ProtectedRoute roles={['barber']}><BarberCalendar /></ProtectedRoute>} />
      <Route path="/barber/availability" element={<ProtectedRoute roles={['barber']}><BarberAvailability /></ProtectedRoute>} />
      <Route path="/barber/profile" element={<ProtectedRoute roles={['barber']}><BarberProfile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
