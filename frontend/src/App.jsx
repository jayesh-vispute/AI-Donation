import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import DashboardLayout from './components/common/DashboardLayout';
import DonorLayout from './components/donor/DonorLayout';
import NgoLayout from './components/ngo/NgoLayout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';

// Donor pages
import DonorDashboard from './pages/donor/DonorDashboard';
import Detect from './pages/donor/Detect';
import Camera from './pages/donor/Camera';
import Results from './pages/donor/Results';
import ItemCart from './pages/donor/ItemCart';
import Matches from './pages/donor/Matches';
import MatchDetails from './pages/donor/MatchDetails';
import Pickup from './pages/donor/Pickup';
import Packaging from './pages/donor/Packaging';
import DonationDetails from './pages/donor/DonationDetails';
import DonationHistory from './pages/donor/DonationHistory';
import DonorProfile from './pages/donor/DonorProfile';
import DonorNotifications from './pages/donor/Notifications';
import NgoList from './pages/donor/NgoList';
import DonorSettings from './pages/donor/DonorSettings';
import DonorAiDetectedItems from './pages/donor/AiDetectedItems';

// NGO pages
import NgoDashboard from './pages/ngo/NgoDashboard';
import NgoProfile from './pages/ngo/NgoProfile';
import DemandRegistry from './pages/ngo/DemandRegistry';
import AddDemand from './pages/ngo/AddDemand';
import EditDemand from './pages/ngo/EditDemand';
import IncomingDonations from './pages/ngo/IncomingDonations';
import NgoDonationDetails from './pages/ngo/NgoDonationDetails';
import PickupCoordination from './pages/ngo/PickupCoordination';
import NgoAnalytics from './pages/ngo/NgoAnalytics';
import NgoNotifications from './pages/ngo/NgoNotifications';
import Inventory from './pages/ngo/Inventory';
import DonorsList from './pages/ngo/DonorsList';
import NgoSettings from './pages/ngo/NgoSettings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import NgoManagement from './pages/admin/NgoManagement';
import NgoRegistrationReview from './pages/admin/NgoRegistrationReview';
import DonorManagement from './pages/admin/DonorManagement';
import DonationMonitoring from './pages/admin/DonationMonitoring';
import MatchMonitoring from './pages/admin/MatchMonitoring';
import SystemHealth from './pages/admin/SystemHealth';
import ImpactMetrics from './pages/admin/ImpactMetrics';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminProfile from './pages/admin/AdminProfile';
import UsersManagement from './pages/admin/UsersManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AiDetectionManagement from './pages/admin/AiDetectionManagement';
import AdminInventory from './pages/admin/AdminInventory';
import AuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/AdminSettings';


import PWAInstallModal from './components/common/PWAInstallModal';

/** Public layout wrapper (Navbar + content) */
function PublicLayout() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading message="Starting Donation AI..." />;
  }

  return (
    <>
      <PWAInstallModal />
      <ErrorBoundary>
        <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Home />} />

        {/* Auth pages (no navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* ===== DONOR ROUTES ===== */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/donor" element={<DonorDashboard />} />
          <Route path="/donate" element={<Detect />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/results" element={<Results />} />
          <Route path="/item-cart" element={<ItemCart />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetails />} />
          <Route path="/pickup/:id" element={<Pickup />} />
          <Route path="/packaging/:id" element={<Packaging />} />
          <Route path="/donations" element={<DonationHistory />} />
          <Route path="/donations/:id" element={<DonationDetails />} />
          <Route path="/donor/ngos" element={<NgoList />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
          <Route path="/donor/notifications" element={<DonorNotifications />} />
          <Route path="/donor/settings" element={<DonorSettings />} />
          <Route path="/donor/ai-detection" element={<DonorAiDetectedItems />} />
        </Route>

        {/* ===== NGO ROUTES ===== */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NgoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/ngo" element={<NgoDashboard />} />
          <Route path="/ngo/profile" element={<NgoProfile />} />
          <Route path="/ngo/donations" element={<IncomingDonations />} />
          <Route path="/ngo/donations/:id" element={<NgoDonationDetails />} />
          <Route path="/ngo/inventory" element={<Inventory />} />
          <Route path="/ngo/item-requests" element={<DemandRegistry />} />
          <Route path="/ngo/demands/add" element={<AddDemand />} />
          <Route path="/ngo/demands/:id/edit" element={<EditDemand />} />
          <Route path="/ngo/donors" element={<DonorsList />} />
          <Route path="/ngo/pickups/:id" element={<PickupCoordination />} />
          <Route path="/ngo/reports" element={<NgoAnalytics />} />
          <Route path="/ngo/notifications" element={<NgoNotifications />} />
          <Route path="/ngo/settings" element={<NgoSettings />} />
        </Route>

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/ngos" element={<NgoManagement />} />
          <Route path="/admin/ngo-approvals" element={<NgoRegistrationReview />} />
          <Route path="/admin/donations" element={<DonationMonitoring />} />
          <Route path="/admin/ai-detection" element={<AiDetectionManagement />} />
          <Route path="/admin/reports" element={<ImpactMetrics />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;

