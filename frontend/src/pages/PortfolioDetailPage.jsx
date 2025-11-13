import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import PortfolioEditModal from '../components/PortfolioEditModal'
import PortfolioDuplicateModal from '../components/PortfolioDuplicateModal'
import ExportModal from '../components/ExportModal'
import ImportModal from '../components/ImportModal'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const PortfolioDetailPage = () => {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [assets, setAssets] = useState([])
  const [suggestedPrice, setSuggestedPrice] = useState(null)
  const [selectedAssetHistory, setSelectedAssetHistory] = useState(null)
  const [portfolios, setPortfolios] = useState([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [formData, setFormData] = useState({
    assetId: '',
    assetSymbol: '',
    assetType: 'STOCK',
    transactionType: 'BUY',
    quantity: '',
    price: '',
    fee: '0',
    transactionDate: new Date().toISOString().slice(0, 16),
    transferPortfolioId: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
    fetchPortfolios()
  }, [id])

  useEffect(() => {
    if (formData.assetSymbol && formData.assetSymbol.length >= 2) {
      searchAssets()
    } else {
      setAssets([])
    }
  }, [formData.assetSymbol])

  useEffect(() => {
    if (formData.transactionType === 'TRANSFER_OUT' || formData.transactionType === 'TRANSFER_IN') {
      fetchPortfolios()
    }
  }, [formData.transactionType])

  const fetchData = async () => {
    try {
      const [portfolioRes, summaryRes, transactionsRes] = await Promise.all([
        api.get(`/portfolios/${id}`),
        api.get(`/analytics/portfolio/${id}/summary`),
        api.get(`/portfolios/${id}/transactions`)
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

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Failed to fetch portfolios:', error)
    }
  }

  const searchAssets = async () => {
    try {
      const response = await api.get(`/market-data/search?query=${encodeURIComponent(formData.assetSymbol)}`)
      setAssets(response.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to search assets:', error)
    }
  }

  const handleAssetSelect = async (asset) => {
    setFormData({ ...formData, assetId: asset.id, assetSymbol: asset.symbol })
    setAssets([])
    
    // Fetch current price
    try {
      const priceResponse = await api.get(`/market-data/asset/${asset.id}/price`).catch(() => null)
      if (priceResponse?.data?.price) {
        setSuggestedPrice(priceResponse.data.price)
        setFormData((prev) => ({ ...prev, price: priceResponse.data.price.toString() }))
      }
    } catch (error) {
      console.error('Failed to fetch price:', error)
    }

    // Fetch transaction history for this asset
    try {
      const historyResponse = await api.get(`/transactions?assetId=${asset.id}&portfolioId=${id}&size=10`)
      const history = historyResponse.data.content || historyResponse.data
      setSelectedAssetHistory(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error('Failed to fetch asset history:', error)
    }
  }

  const fetchAssetHistory = async (assetId) => {
    try {
      const response = await api.get(`/transactions?assetId=${assetId}&portfolioId=${id}&size=20`)
      const history = response.data.content || response.data
      setSelectedAssetHistory(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error('Failed to fetch asset history:', error)
    }
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleCreateTransaction = async (e) => {
    e.preventDefault()
    if (!formData.assetId) {
      alert('Please select an asset')
      return
    }

    // Validate transfer transactions
    if ((formData.transactionType === 'TRANSFER_OUT' || formData.transactionType === 'TRANSFER_IN') && !formData.transferPortfolioId) {
      alert('Please select a destination portfolio for transfer')
      return
    }

    try {
      await api.post('/transactions', {
        portfolioId: id,
        assetId: formData.assetId,
        transactionType: formData.transactionType,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee: parseFloat(formData.fee) || 0,
        transactionDate: new Date(formData.transactionDate).toISOString(),
        transferPortfolioId: formData.transferPortfolioId || undefined,
        notes: formData.notes || undefined
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
        transactionDate: new Date().toISOString().slice(0, 16),
        transferPortfolioId: '',
        notes: ''
      })
      setSuggestedPrice(null)
      setSelectedAssetHistory(null)
      fetchData()
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert(error.response?.data?.message || 'Failed to create transaction')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen={true} />
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDuplicateModal(true)}
            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Duplicate
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-green-600 bg-green-50 rounded-md hover:bg-green-100"
          >
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Import
          </button>
          <Link
            to={`/analytics/${id}`}
            className="px-4 py-2 text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
          >
            Analytics
          </Link>
          <Link
            to={`/portfolios/${id}/rebalance`}
            className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            Rebalance
          </Link>
          <Link
            to={`/portfolios/${id}/tax-report`}
            className="px-4 py-2 text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100"
          >
            Tax Report
          </Link>
          <Link
            to={`/portfolios/${id}/performance-report`}
            className="px-4 py-2 text-pink-600 bg-pink-50 rounded-md hover:bg-pink-100"
          >
            Performance
          </Link>
          <Link
            to={`/portfolios/${id}/correlation`}
            className="px-4 py-2 text-cyan-600 bg-cyan-50 rounded-md hover:bg-cyan-100"
          >
            Correlation
          </Link>
          <Link
            to="/portfolios"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Back
          </Link>
        </div>
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
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Asset *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  value={formData.assetSymbol}
                  onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value, assetId: '' })}
                  placeholder="Search asset symbol..."
                />
                {assets.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAssetSelect(asset)}
                      >
                        <div className="font-medium text-sm">{asset.symbol}</div>
                        <div className="text-xs text-gray-500">{asset.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {suggestedPrice && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  Suggested price: ${parseFloat(suggestedPrice).toFixed(2)}
                </div>
              )}
              {selectedAssetHistory && selectedAssetHistory.length > 0 && (
                <div className="text-xs bg-blue-50 p-2 rounded">
                  <div className="font-medium mb-1">Recent transactions for {formData.assetSymbol}:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedAssetHistory.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="text-gray-600">
                        {new Date(tx.transactionDate).toLocaleDateString()} - {tx.transactionType} {parseFloat(tx.quantity).toFixed(4)} @ ${parseFloat(tx.price).toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Type</label>
                  <select
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value, transferPortfolioId: '' })}
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                    <option value="TRANSFER_OUT">Transfer Out</option>
                    <option value="TRANSFER_IN">Transfer In</option>
                  </select>
                </div>
                {(formData.transactionType === 'TRANSFER_OUT' || formData.transactionType === 'TRANSFER_IN') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Destination Portfolio *</label>
                    <select
                      required
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      value={formData.transferPortfolioId}
                      onChange={(e) => setFormData({ ...formData, transferPortfolioId: e.target.value })}
                    >
                      <option value="">Select Portfolio</option>
                      {portfolios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Quantity *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    min="0"
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
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
                    min="0"
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Date *</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Notes</label>
                <textarea
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
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
                    <tr key={holding.assetId} className="hover:bg-gray-50">
                      <td 
                        className="px-4 py-2 text-sm cursor-pointer"
                        onClick={() => fetchAssetHistory(holding.assetId)}
                      >
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
            <EmptyState
              icon="📊"
              title="No holdings yet"
              message="Add your first transaction to start tracking holdings"
              actionLabel="Add Transaction"
              onAction={() => setShowTransactionForm(true)}
            />
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
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-medium">{tx.assetSymbol}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        tx.transactionType === 'BUY' || tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_IN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.transactionType}
                      </span>
                    </td>
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
          <EmptyState
            icon="💼"
            title="No transactions yet"
            message="Start tracking your investments by adding your first transaction"
            actionLabel="Add Transaction"
            onAction={() => setShowTransactionForm(true)}
          />
        )}
      </div>

      {selectedAssetHistory && selectedAssetHistory.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transaction History: {formData.assetSymbol}</h2>
            <button
              onClick={() => setSelectedAssetHistory(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedAssetHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 text-sm">{new Date(tx.transactionDate).toLocaleDateString()}</td>
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
        </div>
      )}

      {showEditModal && (
        <PortfolioEditModal
          portfolio={portfolio}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchData()
          }}
        />
      )}

      {showDuplicateModal && (
        <PortfolioDuplicateModal
          portfolio={portfolio}
          onClose={() => setShowDuplicateModal(false)}
          onSuccess={(duplicatedPortfolio) => {
            setShowDuplicateModal(false)
            window.location.href = `/portfolios/${duplicatedPortfolio.id}`
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          type="portfolio"
          id={id}
          name={portfolio?.name}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          type="portfolio"
          portfolioId={id}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

export default PortfolioDetailPage

