import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DashboardPage = () => {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data)
      
      // Calculate total value (simplified - would need to fetch summaries)
      setTotalValue(response.data.length * 10000) // Placeholder
    } catch (error) {
      console.error('Failed to fetch portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  // Mock chart data
  const chartData = [
    { date: '2024-01', value: 95000 },
    { date: '2024-02', value: 98000 },
    { date: '2024-03', value: 102000 },
    { date: '2024-04', value: 105000 },
    { date: '2024-05', value: 108000 },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Portfolios</div>
            <div className="text-2xl font-bold text-blue-600">{portfolios.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-green-600">
              ${totalValue.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Active Alerts</div>
            <div className="text-2xl font-bold text-purple-600">0</div>
          </div>
        </div>
      </div>

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

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Portfolios</h2>
          <Link
            to="/portfolios"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View All
          </Link>
        </div>
        {portfolios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No portfolios yet. Create your first portfolio to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.slice(0, 6).map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolios/${portfolio.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg">{portfolio.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{portfolio.description || 'No description'}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Currency: {portfolio.baseCurrency}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage

