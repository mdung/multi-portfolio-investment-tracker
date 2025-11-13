import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PortfolioListPage from './pages/PortfolioListPage'
import PortfolioDetailPage from './pages/PortfolioDetailPage'
import AlertsPage from './pages/AlertsPage'
import UserProfilePage from './pages/UserProfilePage'
import TransactionListPage from './pages/TransactionListPage'
import AssetSearchPage from './pages/AssetSearchPage'
import AssetManagementPage from './pages/AssetManagementPage'
import PortfolioComparisonPage from './pages/PortfolioComparisonPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RebalancingPage from './pages/RebalancingPage'
import TaxReportPage from './pages/TaxReportPage'
import PerformanceReportPage from './pages/PerformanceReportPage'
import CorrelationPage from './pages/CorrelationPage'
import WatchlistPage from './pages/WatchlistPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Router>
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
      </Router>
      </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App

