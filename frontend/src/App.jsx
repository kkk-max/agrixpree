import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import AppLayout from './components/common/AppLayout';
import useAuthStore from './store/authStore';

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

import StoreFrontPage from './pages/shop/StoreFrontPage';
import CartPage from './pages/shop/CartPage';
import CheckoutPage from './pages/shop/CheckoutPage';
import OrderSuccessPage from './pages/shop/OrderSuccessPage';
import CustomerSignupPage from './pages/shop/CustomerSignupPage';
import AccountPage from './pages/shop/AccountPage';
import ShopProductsPage from './pages/admin/ShopProductsPage';
import ShopOrdersPage from './pages/admin/ShopOrdersPage';
import ShopCategoriesPage from './pages/admin/ShopCategoriesPage';

const Wrapped = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

// Index route: guests and shop customers see the storefront;
// staff (admin/farmer/buyer) are sent to their dashboards.
const IndexRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && ['admin', 'farmer', 'buyer'].includes(user?.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <StoreFrontPage />;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<IndexRoute />} />
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

      {/* Admin shop routes */}
      <Route path="/admin/shop-categories" element={<Wrapped><RoleRoute roles={['admin']}><ShopCategoriesPage /></RoleRoute></Wrapped>} />
      <Route path="/admin/shop-products" element={<Wrapped><RoleRoute roles={['admin']}><ShopProductsPage /></RoleRoute></Wrapped>} />
      <Route path="/admin/shop-orders" element={<Wrapped><RoleRoute roles={['admin']}><ShopOrdersPage /></RoleRoute></Wrapped>} />

      {/* Public shop routes */}
      <Route path="/store" element={<Navigate to="/" replace />} />
      <Route path="/store/cart" element={<CartPage />} />
      <Route path="/store/signup" element={<CustomerSignupPage />} />
      <Route path="/store/checkout" element={<CheckoutPage />} />
      <Route path="/store/account" element={<AccountPage />} />
      <Route path="/store/order-success" element={<OrderSuccessPage />} />

      {/* Common */}
      <Route path="/notifications" element={<Wrapped><NotificationsPage /></Wrapped>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
