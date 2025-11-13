import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const RebalancingPage = () => {
  const { id } = useParams()
  const { showToast } = useToast()
  const [portfolio, setPortfolio] = useState(null)
  const [summary, setSummary] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [targetAllocations, setTargetAllocations] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (summary && summary.holdings) {
      const initial = {}
      summary.holdings.forEach((holding) => {
        const currentAllocation = summary.totalValue.compareTo(0) > 0
          ? (holding.currentValue / summary.totalValue) * 100
          : 0
        initial[holding.assetId] = currentAllocation.toFixed(2)
      })
      setTargetAllocations(initial)
    }
  }, [summary])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [portfolioRes, summaryRes] = await Promise.all([
        api.get(`/portfolios/${id}`),
        api.get(`/analytics/portfolio/${id}/summary`)
      ])
      setPortfolio(portfolioRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showToast('Failed to load portfolio data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateSuggestions = async () => {
    try {
      const allocations = {}
      Object.keys(targetAllocations).forEach((assetId) => {
        allocations[assetId] = parseFloat(targetAllocations[assetId])
      })

      const response = await api.post(`/portfolios/${id}/rebalance`, {
        targetAllocations: allocations
      })
      setSuggestions(response.data)
    } catch (error) {
      console.error('Failed to calculate suggestions:', error)
      showToast('Failed to calculate rebalancing suggestions', 'error')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const chartData = suggestions.map((suggestion) => ({
    name: suggestion.assetSymbol,
    current: parseFloat(suggestion.currentAllocation),
    target: parseFloat(suggestion.targetAllocation),
    difference: parseFloat(suggestion.difference)
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Rebalancing</h1>
          <p className="text-gray-600">{portfolio?.name}</p>
        </div>
        <Link
          to={`/portfolios/${id}`}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back to Portfolio
        </Link>
      </div>

      {summary && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Set Target Allocations</h2>
          <div className="space-y-3 mb-4">
            {summary.holdings.map((holding) => (
              <div key={holding.assetId} className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="font-medium">{holding.assetSymbol}</div>
                  <div className="text-sm text-gray-500">Current: {((holding.currentValue / summary.totalValue) * 100).toFixed(2)}%</div>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={targetAllocations[holding.assetId] || ''}
                    onChange={(e) => setTargetAllocations({
                      ...targetAllocations,
                      [holding.assetId]: e.target.value
                    })}
                    placeholder="Target %"
                  />
                </div>
                <div className="text-sm text-gray-500 w-16">%</div>
              </div>
            ))}
          </div>
          <button
            onClick={calculateSuggestions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Calculate Rebalancing Suggestions
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Rebalancing Suggestions</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#6b7280" name="Current %" />
                <Bar dataKey="target" fill="#3b82f6" name="Target %" />
                <Bar dataKey="difference" fill="#ef4444" name="Difference %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Action Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Difference</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion.assetId}>
                      <td className="px-4 py-3 text-sm font-medium">{suggestion.assetSymbol}</td>
                      <td className="px-4 py-3 text-sm text-right">{parseFloat(suggestion.currentAllocation).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right">{parseFloat(suggestion.targetAllocation).toFixed(2)}%</td>
                      <td className={`px-4 py-3 text-sm text-right ${
                        parseFloat(suggestion.difference) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(suggestion.difference) >= 0 ? '+' : ''}{parseFloat(suggestion.difference).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          suggestion.action === 'BUY' ? 'bg-green-100 text-green-800' :
                          suggestion.action === 'SELL' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {suggestion.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${Math.abs(parseFloat(suggestion.suggestedAction)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RebalancingPage

