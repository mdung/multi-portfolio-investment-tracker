import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const PortfolioDetailPage = () => {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [formData, setFormData] = useState({
    assetId: '',
    assetSymbol: '',
    assetType: 'STOCK',
    transactionType: 'BUY',
    quantity: '',
    price: '',
    fee: '0',
    transactionDate: new Date().toISOString().slice(0, 16)
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [portfolioRes, summaryRes, transactionsRes] = await Promise.all([
        api.get(`/portfolios/${id}`),
        api.get(`/analytics/portfolio/${id}/summary`),
        api.get(`/transactions/portfolio/${id}`)
      ])
      setPortfolio(portfolioRes.data)
      setSummary(summaryRes.data)
      setTransactions(transactionsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (e) => {
    e.preventDefault()
    try {
      // First, get or create asset
      const assetResponse = await api.get(`/assets/search?symbol=${formData.assetSymbol}`)
      let assetId = formData.assetId

      if (!assetId && assetResponse.data.length > 0) {
        assetId = assetResponse.data[0].id
      } else {
        // Create asset (would need asset creation endpoint)
        alert('Asset creation not implemented in this demo. Please use existing assets.')
        return
      }

      await api.post('/transactions', {
        portfolioId: id,
        assetId: assetId,
        transactionType: formData.transactionType,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee: parseFloat(formData.fee) || 0,
        transactionDate: new Date(formData.transactionDate).toISOString()
      })

      setShowTransactionForm(false)
      setFormData({
        assetId: '',
        assetSymbol: '',
        assetType: 'STOCK',
        transactionType: 'BUY',
        quantity: '',
        price: '',
        fee: '0',
        transactionDate: new Date().toISOString().slice(0, 16)
      })
      fetchData()
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!portfolio) {
    return <div className="text-center py-8">Portfolio not found</div>
  }

  const allocationData = summary?.allocationByAssetType
    ? Object.entries(summary.allocationByAssetType).map(([name, value]) => ({
        name,
        value: parseFloat(value)
      }))
    : []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
          <p className="text-gray-600">{portfolio.description}</p>
        </div>
        <Link
          to="/portfolios"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back to Portfolios
        </Link>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-blue-600">
              ${parseFloat(summary.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-2xl font-bold text-gray-600">
              ${parseFloat(summary.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600">Total P&L</div>
            <div className={`text-2xl font-bold ${parseFloat(summary.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${parseFloat(summary.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600">P&L %</div>
            <div className={`text-2xl font-bold ${parseFloat(summary.totalPnLPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(summary.totalPnLPercent).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

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
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Holdings</h2>
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {showTransactionForm ? 'Cancel' : 'Add Transaction'}
            </button>
          </div>

          {showTransactionForm && (
            <form onSubmit={handleCreateTransaction} className="mb-4 space-y-3 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Asset Symbol</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.assetSymbol}
                    onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Type</label>
                  <select
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Transaction
              </button>
            </form>
          )}

          {summary?.holdings && summary.holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Asset</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Value</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">P&L</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.holdings.map((holding) => (
                    <tr key={holding.assetId}>
                      <td className="px-4 py-2 text-sm">
                        <div className="font-medium">{holding.assetSymbol}</div>
                        <div className="text-xs text-gray-500">{holding.assetName}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{parseFloat(holding.quantity).toFixed(4)}</td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(holding.currentPrice).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(holding.currentValue).toFixed(2)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${parseFloat(holding.unrealizedPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${parseFloat(holding.unrealizedPnL).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No holdings yet</div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Asset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 text-sm">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-medium">{tx.assetSymbol}</td>
                    <td className="px-4 py-2 text-sm">{tx.transactionType}</td>
                    <td className="px-4 py-2 text-sm text-right">{parseFloat(tx.quantity).toFixed(4)}</td>
                    <td className="px-4 py-2 text-sm text-right">${parseFloat(tx.price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      ${(parseFloat(tx.quantity) * parseFloat(tx.price) + parseFloat(tx.fee || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No transactions yet</div>
        )}
      </div>
    </div>
  )
}

export default PortfolioDetailPage

