import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PortfolioListPage from './pages/PortfolioListPage'
import PortfolioDetailPage from './pages/PortfolioDetailPage'
import AlertsPage from './pages/AlertsPage'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

