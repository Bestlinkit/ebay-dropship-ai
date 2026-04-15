import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Discovery from './pages/Discovery';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import OptimizeProduct from './pages/OptimizeProduct';
import VideoLab from './pages/VideoLab';
import PublishProduct from './pages/PublishProduct';
import MyProducts from './pages/MyProducts';
import Analytics from './pages/Analytics';
import Marketing from './pages/Marketing';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AuthCallback from './pages/AuthCallback';
import IntelligenceReview from './pages/IntelligenceReview';
import SupplierSourcing from './pages/SupplierSourcing';
import GlobalSourcing from './pages/GlobalSourcing';
import ProductImportPreview from './pages/ProductImportPreview';

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <ErrorBoundary>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/discovery" element={
                <ProtectedRoute>
                  <Layout>
                    <Discovery />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/intelligence-review/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <IntelligenceReview />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/supplier-sourcing" element={
                <ProtectedRoute>
                  <Layout>
                    <SupplierSourcing />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/global-sourcing" element={
                <ProtectedRoute>
                  <Layout>
                    <GlobalSourcing />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/product-import-preview" element={
                <ProtectedRoute>
                  <Layout>
                    <ProductImportPreview />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/optimize/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <OptimizeProduct />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/publish/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PublishProduct />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/products" element={
                <ProtectedRoute>
                  <Layout>
                    <MyProducts />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/video" element={
                <ProtectedRoute>
                  <Layout>
                    <VideoLab />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/marketing" element={
                <ProtectedRoute>
                  <Layout>
                    <Marketing />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* eBay API Routes */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/auth/ebay/callback" element={<AuthCallback />} />
              <Route path="/auth/ebay/declined" element={<AuthCallback />} />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </Router>
);
}

export default App;
