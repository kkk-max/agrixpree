import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import AppLayout from './components/common/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import FarmerDashboard from './pages/farmer/DashboardPage';
import InventoryPage from './pages/farmer/InventoryPage';
import AddProductPage from './pages/farmer/AddProductPage';
import EditProductPage from './pages/farmer/EditProductPage';

import BuyerDashboard from './pages/buyer/DashboardPage';
import BrowsePage from './pages/buyer/BrowsePage';

import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import KycReviewPage from './pages/admin/KycReviewPage';
import AdminProductsPage from './pages/admin/ProductsPage';
import ProcurementPage from './pages/admin/ProcurementPage';

import NotificationsPage from './pages/common/NotificationsPage';
import NotFoundPage from './pages/common/NotFoundPage';

const Wrapped = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Farmer routes */}
      <Route path="/farmer/dashboard" element={<Wrapped><RoleRoute roles={['farmer']}><FarmerDashboard /></RoleRoute></Wrapped>} />
      <Route path="/farmer/inventory" element={<Wrapped><RoleRoute roles={['farmer']}><InventoryPage /></RoleRoute></Wrapped>} />
      <Route path="/farmer/inventory/add" element={<Wrapped><RoleRoute roles={['farmer']}><AddProductPage /></RoleRoute></Wrapped>} />
      <Route path="/farmer/inventory/edit/:id" element={<Wrapped><RoleRoute roles={['farmer']}><EditProductPage /></RoleRoute></Wrapped>} />

      {/* Buyer routes */}
      <Route path="/buyer/dashboard" element={<Wrapped><RoleRoute roles={['buyer']}><BuyerDashboard /></RoleRoute></Wrapped>} />
      <Route path="/buyer/browse" element={<Wrapped><RoleRoute roles={['buyer']}><BrowsePage /></RoleRoute></Wrapped>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<Wrapped><RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute></Wrapped>} />
      <Route path="/admin/users" element={<Wrapped><RoleRoute roles={['admin']}><AdminUsersPage /></RoleRoute></Wrapped>} />
      <Route path="/admin/kyc" element={<Wrapped><RoleRoute roles={['admin']}><KycReviewPage /></RoleRoute></Wrapped>} />
      <Route path="/admin/products" element={<Wrapped><RoleRoute roles={['admin']}><AdminProductsPage /></RoleRoute></Wrapped>} />
      <Route path="/admin/procurement" element={<Wrapped><RoleRoute roles={['admin']}><ProcurementPage /></RoleRoute></Wrapped>} />

      {/* Common */}
      <Route path="/notifications" element={<Wrapped><NotificationsPage /></Wrapped>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
