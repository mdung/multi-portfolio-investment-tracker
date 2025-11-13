import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const TaxReportPage = () => {
  const { id } = useParams()
  const { showToast } = useToast()
  const [portfolio, setPortfolio] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
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

      const response = await api.get(`/reports/tax?${params.toString()}`)
      setReport(response.data)
    } catch (error) {
      console.error('Failed to fetch tax report:', error)
      showToast('Failed to generate tax report', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.append('portfolioId', id)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await api.get(`/reports/tax?${params.toString()}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `tax_report_${portfolio?.name}_${dateRange.startDate}_${dateRange.endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToast('Tax report exported successfully', 'success')
    } catch (error) {
      console.error('Failed to export tax report:', error)
      showToast('Failed to export tax report', 'error')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const gainsChartData = report?.gainsByAsset
    ? Object.entries(report.gainsByAsset).map(([symbol, amount]) => ({
        symbol,
        amount: parseFloat(amount)
      }))
    : []

  const lossesChartData = report?.lossesByAsset
    ? Object.entries(report.lossesByAsset).map(([symbol, amount]) => ({
        symbol,
        amount: parseFloat(amount)
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Report</h1>
          <p className="text-gray-600">{portfolio?.name}</p>
        </div>
        <div className="flex space-x-2">
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
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Realized Gains</div>
              <div className="text-2xl font-bold text-green-600">
                ${parseFloat(report.totalRealizedGains).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Realized Losses</div>
              <div className="text-2xl font-bold text-red-600">
                ${parseFloat(report.totalRealizedLosses).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Net Realized Gains</div>
              <div className={`text-2xl font-bold ${
                parseFloat(report.netRealizedGains) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${parseFloat(report.netRealizedGains).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gainsChartData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Gains by Asset</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gainsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {lossesChartData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Losses by Asset</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lossesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Realized Transactions</h2>
            {report.realizedTransactions && report.realizedTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost Basis</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loss</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.realizedTransactions.map((tx, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium">{tx.assetSymbol}</td>
                        <td className="px-4 py-3 text-sm">{new Date(tx.sellDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{parseFloat(tx.quantity).toFixed(4)}</td>
                        <td className="px-4 py-3 text-sm text-right">${parseFloat(tx.sellPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right">${parseFloat(tx.costBasis).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          ${parseFloat(tx.realizedGain).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          ${parseFloat(tx.realizedLoss).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No realized transactions in this period</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default TaxReportPage

