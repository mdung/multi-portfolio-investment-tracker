import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PerformanceReportPage = () => {
  const { id } = useParams()
  const { showToast } = useToast()
  const [portfolio, setPortfolio] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchPortfolio()
    fetchReport()
  }, [id, dateRange])

  const fetchPortfolio = async () => {
    try {
      const response = await api.get(`/portfolios/${id}`)
      setPortfolio(response.data)
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('portfolioId', id)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await api.get(`/reports/performance?${params.toString()}`)
      setReport(response.data)
    } catch (error) {
      console.error('Failed to fetch performance report:', error)
      showToast('Failed to generate performance report', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const chartData = report?.dailyPerformance
    ? report.dailyPerformance.map((point) => ({
        date: new Date(point.date).toLocaleDateString(),
        value: parseFloat(point.value),
        returnPercent: parseFloat(point.returnPercent)
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
          <p className="text-gray-600">{portfolio?.name}</p>
        </div>
        <div className="flex space-x-2">
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
          <Link
            to={`/portfolios/${id}`}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Back
          </Link>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Starting Value</div>
              <div className="text-2xl font-bold text-blue-600">
                ${parseFloat(report.startingValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Ending Value</div>
              <div className="text-2xl font-bold text-green-600">
                ${parseFloat(report.endingValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Return</div>
              <div className={`text-2xl font-bold ${
                parseFloat(report.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${parseFloat(report.totalReturn).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Return %</div>
              <div className={`text-2xl font-bold ${
                parseFloat(report.totalReturnPercent) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(report.totalReturnPercent).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Best Day</div>
              <div className="text-xl font-bold text-green-600">
                {parseFloat(report.bestDayReturn).toFixed(2)}%
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Worst Day</div>
              <div className="text-xl font-bold text-red-600">
                {parseFloat(report.worstDayReturn).toFixed(2)}%
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Daily Return</div>
              <div className={`text-xl font-bold ${
                parseFloat(report.averageDailyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(report.averageDailyReturn).toFixed(2)}%
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Volatility</div>
              <div className="text-xl font-bold text-orange-600">
                {parseFloat(report.volatility).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Portfolio Value" />
                  <Line type="monotone" dataKey="returnPercent" stroke="#10b981" strokeWidth={2} name="Return %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No performance data available</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PerformanceReportPage

