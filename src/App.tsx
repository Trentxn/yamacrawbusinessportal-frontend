import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import AuthLayout from '@/layouts/AuthLayout'
import AccountLayout from '@/layouts/AccountLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminLayout from '@/layouts/AdminLayout'
import SystemAdminLayout from '@/layouts/SystemAdminLayout'

// Public pages
import HomePage from '@/pages/public/HomePage'
import DirectoryPage from '@/pages/public/DirectoryPage'
import CategoryPage from '@/pages/public/CategoryPage'
import BusinessDetailPage from '@/pages/public/BusinessDetailPage'
import SearchResultsPage from '@/pages/public/SearchResultsPage'
import AboutPage from '@/pages/public/AboutPage'
import TermsPage from '@/pages/public/TermsPage'
import PrivacyPage from '@/pages/public/PrivacyPage'
import FaqPage from '@/pages/public/FaqPage'
import ContactPage from '@/pages/public/ContactPage'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Account pages (public_user)
import UserInquiries from '@/pages/account/UserInquiries'
import UserInquiryDetail from '@/pages/account/UserInquiryDetail'
import ProfileSettings from '@/pages/account/ProfileSettings'

// Dashboard pages (business_owner)
import OwnerOverview from '@/pages/dashboard/OwnerOverview'
import MyListings from '@/pages/dashboard/MyListings'
import CreateListing from '@/pages/dashboard/CreateListing'
import EditListing from '@/pages/dashboard/EditListing'
import ReceivedInquiries from '@/pages/dashboard/ReceivedInquiries'
import InquiryDetail from '@/pages/dashboard/InquiryDetail'
import OwnerReviews from '@/pages/dashboard/OwnerReviews'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ModerationQueue from '@/pages/admin/ModerationQueue'
import ModerationDetail from '@/pages/admin/ModerationDetail'
import AdminBusinessList from '@/pages/admin/AdminBusinessList'
import AdminBusinessDetail from '@/pages/admin/AdminBusinessDetail'
import CategoryManagement from '@/pages/admin/CategoryManagement'
import AdminUserList from '@/pages/admin/AdminUserList'
import AdminInquiries from '@/pages/admin/AdminInquiries'
import AdminInquiryDetail from '@/pages/admin/AdminInquiryDetail'
import AdminReviews from '@/pages/admin/AdminReviews'
import FlagQueue from '@/pages/admin/FlagQueue'
import PortalFeedback from '@/pages/admin/PortalFeedback'

// System admin pages
import SystemDashboard from '@/pages/system/SystemDashboard'
import UserManagement from '@/pages/system/UserManagement'
import UserDetail from '@/pages/system/UserDetail'
import AuditLogViewer from '@/pages/system/AuditLogViewer'
import BugReports from '@/pages/system/BugReports'

// Shared
import NotFoundPage from '@/pages/NotFoundPage'
import AccountRedirect from '@/components/AccountRedirect'

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/directory/:slug" element={<CategoryPage />} />
        <Route path="/business/:slug" element={<BusinessDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Registered user account */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AccountRedirect />} />
        <Route path="inquiries" element={<UserInquiries />} />
        <Route path="inquiries/:id" element={<UserInquiryDetail />} />
        <Route path="profile" element={<ProfileSettings />} />
      </Route>

      {/* Business owner dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={['business_owner', 'contractor', 'admin', 'system_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OwnerOverview />} />
        <Route path="listings" element={<MyListings />} />
        <Route path="listings/new" element={<CreateListing />} />
        <Route path="listings/:id/edit" element={<EditListing />} />
        <Route path="inquiries" element={<ReceivedInquiries />} />
        <Route path="inquiries/:id" element={<InquiryDetail />} />
        <Route path="reviews" element={<OwnerReviews />} />
      </Route>

      {/* Admin portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['admin', 'system_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="moderation" element={<ModerationQueue />} />
        <Route path="moderation/:id" element={<ModerationDetail />} />
        <Route path="businesses" element={<AdminBusinessList />} />
        <Route path="businesses/:id" element={<AdminBusinessDetail />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="users" element={<AdminUserList />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="flags" element={<FlagQueue />} />
        <Route path="portal-feedback" element={<PortalFeedback />} />
      </Route>

      {/* System admin portal */}
      <Route
        path="/system"
        element={
          <ProtectedRoute requiredRoles={['system_admin']}>
            <SystemAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SystemDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="audit-logs" element={<AuditLogViewer />} />
        <Route path="bug-reports" element={<BugReports />} />
        {/* Admin pages rendered inside system admin layout */}
        <Route path="moderation" element={<ModerationQueue />} />
        <Route path="moderation/:id" element={<ModerationDetail />} />
        <Route path="businesses" element={<AdminBusinessList />} />
        <Route path="businesses/:id" element={<AdminBusinessDetail />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="flags" element={<FlagQueue />} />
        <Route path="portal-feedback" element={<PortalFeedback />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
