import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PortfolioComparisonPage = () => {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolios, setSelectedPortfolios] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolios()
  }, [])

  useEffect(() => {
    if (selectedPortfolios.length > 0) {
      fetchComparisonData()
    } else {
      setComparisonData([])
    }
  }, [selectedPortfolios])

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data)
    } catch (error) {
      console.error('Failed to fetch portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComparisonData = async () => {
    setLoading(true)
    try {
      const promises = selectedPortfolios.map(async (portfolioId) => {
        try {
          const [summaryRes, performanceRes] = await Promise.all([
            api.get(`/analytics/portfolio/${portfolioId}/summary`),
            api.get(`/analytics/portfolio/${portfolioId}/performance?interval=WEEKLY`).catch(() => ({ data: [] }))
          ])
          return {
            portfolioId,
            portfolio: portfolios.find((p) => p.id === portfolioId),
            summary: summaryRes.data,
            performance: performanceRes.data || []
          }
        } catch (error) {
          console.error(`Failed to fetch data for portfolio ${portfolioId}:`, error)
          return null
        }
      })

      const results = await Promise.all(promises)
      setComparisonData(results.filter((r) => r !== null))
    } catch (error) {
      console.error('Failed to fetch comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePortfolioToggle = (portfolioId) => {
    setSelectedPortfolios((prev) =>
      prev.includes(portfolioId)
        ? prev.filter((id) => id !== portfolioId)
        : [...prev, portfolioId]
    )
  }

  const chartData = comparisonData
    .flatMap((data) =>
      (data.performance || []).map((point) => ({
        date: new Date(point.date).toLocaleDateString(),
        [data.portfolio?.name || 'Portfolio']: parseFloat(point.totalValue)
      }))
    )
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.date === curr.date)
      if (existing) {
        Object.assign(existing, curr)
      } else {
        acc.push(curr)
      }
      return acc
    }, [])
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (loading && portfolios.length === 0) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Comparison</h1>
        <Link
          to="/portfolios"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back to Portfolios
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Select Portfolios to Compare</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedPortfolios.includes(portfolio.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePortfolioToggle(portfolio.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{portfolio.name}</h3>
                  <p className="text-sm text-gray-600">{portfolio.description || 'No description'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedPortfolios.includes(portfolio.id)}
                  onChange={() => handlePortfolioToggle(portfolio.id)}
                  className="h-5 w-5 text-blue-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {comparisonData.length > 0 && (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Comparison</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {comparisonData.map((data, index) => (
                    <Line
                      key={data.portfolioId}
                      type="monotone"
                      dataKey={data.portfolio?.name || 'Portfolio'}
                      stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No performance data available</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {comparisonData.map((data) => (
              <div key={data.portfolioId} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {data.portfolio?.name || 'Portfolio'}
                </h3>
                {data.summary && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold">
                        ${parseFloat(data.summary.totalValue).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-semibold">
                        ${parseFloat(data.summary.totalCost).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total P&L:</span>
                      <span
                        className={`font-semibold ${
                          parseFloat(data.summary.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${parseFloat(data.summary.totalPnL).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P&L %:</span>
                      <span
                        className={`font-semibold ${
                          parseFloat(data.summary.totalPnLPercent) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {parseFloat(data.summary.totalPnLPercent).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        to={`/portfolios/${data.portfolioId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default PortfolioComparisonPage

