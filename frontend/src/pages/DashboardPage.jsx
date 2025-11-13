import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import QuickActionModal from '../components/QuickActionModal'
import { useToast } from '../context/ToastContext'

const DashboardPage = () => {
  const { showToast } = useToast()
  const [portfolios, setPortfolios] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuickAction, setShowQuickAction] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [portfoliosRes, dashboardRes, transactionsRes, alertsRes] = await Promise.all([
        api.get('/portfolios'),
        api.get('/analytics/dashboard'),
        api.get('/transactions?size=5'),
        api.get('/alerts/triggered')
      ])
      setPortfolios(portfoliosRes.data)
      setDashboard(dashboardRes.data)
      
      const transactions = transactionsRes.data.content || transactionsRes.data
      setRecentTransactions(Array.isArray(transactions) ? transactions.slice(0, 5) : [])
      setRecentAlerts(alertsRes.data || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const chartData = dashboard?.recentTransactions
    ? dashboard.recentTransactions.map((tx, index) => ({
        date: new Date(tx.transactionDate).toLocaleDateString(),
        value: parseFloat(tx.quantity) * parseFloat(tx.price)
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQuickAction('transaction')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quick Add Transaction
          </button>
          <button
            onClick={() => setShowQuickAction('portfolio')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Quick Create Portfolio
          </button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total Net Worth</div>
            <div className="text-2xl font-bold text-blue-600">
              ${parseFloat(dashboard.totalNetWorth || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">{dashboard.baseCurrency || 'USD'}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total P&L</div>
            <div
              className={`text-2xl font-bold ${
                parseFloat(dashboard.overallPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ${parseFloat(dashboard.overallPnL || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(dashboard.overallPnLPercent || 0).toFixed(2)}%
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total Portfolios</div>
            <div className="text-2xl font-bold text-purple-600">{dashboard.totalPortfolios || portfolios.length}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Active Alerts</div>
            <div className="text-2xl font-bold text-orange-600">{recentAlerts.length}</div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio Value Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Portfolio Quick View</h2>
            <Link
              to="/portfolios"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>
          {portfolios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No portfolios yet. Create your first portfolio to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {portfolios.slice(0, 5).map((portfolio) => (
                <Link
                  key={portfolio.id}
                  to={`/portfolios/${portfolio.id}`}
                  className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{portfolio.name}</h3>
                      <p className="text-sm text-gray-600">{portfolio.description || 'No description'}</p>
                    </div>
                    <div className="text-sm text-gray-500">{portfolio.baseCurrency}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Transactions</h3>
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-gray-500">No recent transactions</p>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="text-sm border-l-2 border-blue-500 pl-3">
                      <div className="font-medium">{tx.assetSymbol}</div>
                      <div className="text-gray-600">
                        {tx.transactionType} - {parseFloat(tx.quantity).toFixed(4)} @ $
                        {parseFloat(tx.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.transactionDate).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Triggered Alerts</h3>
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-gray-500">No triggered alerts</p>
              ) : (
                <div className="space-y-2">
                  {recentAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="text-sm border-l-2 border-red-500 pl-3">
                      <div className="font-medium text-red-600">{alert.assetSymbol}</div>
                      <div className="text-gray-600">
                        {alert.conditionType} ${parseFloat(alert.targetPrice).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : 'Recently'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQuickAction && (
        <QuickActionModal
          type={showQuickAction}
          onClose={() => setShowQuickAction(null)}
          onSuccess={(data) => {
            setShowQuickAction(null)
            if (data && data.id) {
              window.location.href = `/portfolios/${data.id}`
            } else {
              fetchDashboardData()
              showToast('Operation completed successfully', 'success')
            }
          }}
        />
      )}
    </div>
  )
}

export default DashboardPage

