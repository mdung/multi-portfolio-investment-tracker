import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PortfolioListPage = lazy(() => import('./pages/PortfolioListPage'))
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const TransactionListPage = lazy(() => import('./pages/TransactionListPage'))
const AssetSearchPage = lazy(() => import('./pages/AssetSearchPage'))
const AssetManagementPage = lazy(() => import('./pages/AssetManagementPage'))
const PortfolioComparisonPage = lazy(() => import('./pages/PortfolioComparisonPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const RebalancingPage = lazy(() => import('./pages/RebalancingPage'))
const TaxReportPage = lazy(() => import('./pages/TaxReportPage'))
const PerformanceReportPage = lazy(() => import('./pages/PerformanceReportPage'))
const CorrelationPage = lazy(() => import('./pages/CorrelationPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const Layout = lazy(() => import('./components/Layout'))

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner fullScreen={true} />}>
                <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios"
            element={
              <PrivateRoute>
                <Layout>
                  <PortfolioListPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <PortfolioDetailPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <Layout>
                  <AlertsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <UserProfilePage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Layout>
                  <TransactionListPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assets/search"
            element={
              <PrivateRoute>
                <Layout>
                  <AssetSearchPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <PrivateRoute>
                <Layout>
                  <AssetManagementPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/compare"
            element={
              <PrivateRoute>
                <Layout>
                  <PortfolioComparisonPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/:id/rebalance"
            element={
              <PrivateRoute>
                <Layout>
                  <RebalancingPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/:id/tax-report"
            element={
              <PrivateRoute>
                <Layout>
                  <TaxReportPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/:id/performance-report"
            element={
              <PrivateRoute>
                <Layout>
                  <PerformanceReportPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolios/:id/correlation"
            element={
              <PrivateRoute>
                <Layout>
                  <CorrelationPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <PrivateRoute>
                <Layout>
                  <WatchlistPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </PrivateRoute>
            }
          />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

