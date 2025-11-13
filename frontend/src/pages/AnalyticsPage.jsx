import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const AnalyticsPage = () => {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [summary, setSummary] = useState(null)
  const [performance, setPerformance] = useState([])
  const [returns, setReturns] = useState(null)
  const [riskMetrics, setRiskMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interval, setInterval] = useState('WEEKLY')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id, interval, dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [portfolioRes, summaryRes, performanceRes, returnsRes, riskRes] = await Promise.all([
        api.get(`/portfolios/${id}`),
        api.get(`/analytics/portfolio/${id}/summary`),
        api.get(`/analytics/portfolio/${id}/performance?interval=${interval}`),
        api.get(`/analytics/portfolio/${id}/returns`),
        api.get(`/analytics/portfolio/${id}/risk-metrics`)
      ])
      setPortfolio(portfolioRes.data)
      setSummary(summaryRes.data)
      setPerformance(performanceRes.data || [])
      setReturns(returnsRes.data)
      setRiskMetrics(riskRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const performanceChartData = performance.map((point) => ({
    date: new Date(point.date).toLocaleDateString(),
    value: parseFloat(point.totalValue),
    cost: parseFloat(point.totalCost),
    pnl: parseFloat(point.totalPnL)
  }))

  const allocationData = summary?.allocationByAssetType
    ? Object.entries(summary.allocationByAssetType).map(([name, value]) => ({
        name,
        value: parseFloat(value)
      }))
    : []

  const holdingsData = summary?.holdings
    ? summary.holdings
        .map((holding) => ({
          name: holding.assetSymbol,
          value: parseFloat(holding.currentValue)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics: {portfolio?.name}</h1>
          <p className="text-gray-600">Performance, returns, and risk analysis</p>
        </div>
        <div className="flex space-x-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio Value Over Time</h2>
        {performanceChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Total Value" />
              <Line type="monotone" dataKey="cost" stroke="#6b7280" strokeWidth={2} name="Total Cost" />
              <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} name="P&L" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">No performance data available</div>
        )}
      </div>

      {/* Returns Analysis */}
      {returns && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Returns Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Daily Return</div>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(returns.dailyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {parseFloat(returns.dailyReturn).toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Weekly Return</div>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(returns.weeklyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {parseFloat(returns.weeklyReturn).toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600">Monthly Return</div>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(returns.monthlyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {parseFloat(returns.monthlyReturn).toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Yearly Return</div>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(returns.yearlyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {parseFloat(returns.yearlyReturn).toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Return</div>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(returns.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {parseFloat(returns.totalReturn).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Risk Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Portfolio Concentration</div>
              <div className="text-2xl font-bold text-red-600">
                {parseFloat(riskMetrics.portfolioConcentration).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Top 5 assets allocation</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Volatility</div>
              <div className="text-2xl font-bold text-orange-600">
                {parseFloat(riskMetrics.volatility).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Standard deviation of returns</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
              <div className="text-2xl font-bold text-blue-600">
                {parseFloat(riskMetrics.sharpeRatio).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Risk-adjusted return</div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Allocation by Asset Type</h2>
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">No allocation data available</div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Holdings by Value</h2>
          {holdingsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={holdingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">No holdings data available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

