import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import TransactionEditModal from '../components/TransactionEditModal'
import TransactionDeleteModal from '../components/TransactionDeleteModal'
import ExportModal from '../components/ExportModal'
import ImportModal from '../components/ImportModal'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import AdvancedFilters from '../components/AdvancedFilters'

const TransactionListPage = () => {
  const [transactions, setTransactions] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    portfolioId: '',
    assetId: '',
    transactionType: '',
    startDate: '',
    endDate: '',
    page: 0,
    size: 20
  })
  const [totalPages, setTotalPages] = useState(0)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [savedFilters, setSavedFilters] = useState([])

  useEffect(() => {
    fetchPortfolios()
    fetchAssets()
    fetchTransactions()
    // Load saved filters
    const saved = localStorage.getItem('savedFilters')
    if (saved) {
      setSavedFilters(JSON.parse(saved))
    }
  }, [filters])

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data)
    } catch (error) {
      console.error('Failed to fetch portfolios:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets?size=1000')
      setAssets(response.data.content || response.data)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.portfolioId) params.append('portfolioId', filters.portfolioId)
      if (filters.assetId) params.append('assetId', filters.assetId)
      if (filters.transactionType) params.append('transactionType', filters.transactionType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('page', filters.page)
      params.append('size', filters.size)

      const response = await api.get(`/transactions?${params.toString()}`)
      const data = response.data
      if (data.content) {
        setTransactions(data.content)
        setTotalPages(data.totalPages)
      } else {
        setTransactions(data)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 0 })
  }

  const handleDelete = (transaction) => {
    setDeletingTransaction(transaction)
  }

  const filteredTransactions = (() => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.assetName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.transactionDate) - new Date(b.transactionDate)
          break
        case 'amount':
          comparison = (parseFloat(a.quantity) * parseFloat(a.price)) - (parseFloat(b.quantity) * parseFloat(b.price))
          break
        case 'asset':
          comparison = (a.assetSymbol || '').localeCompare(b.assetSymbol || '')
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  })()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.portfolioId}
              onChange={(e) => handleFilterChange('portfolioId', e.target.value)}
            >
              <option value="">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.assetId}
              onChange={(e) => handleFilterChange('assetId', e.target.value)}
            >
              <option value="">All Assets</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        <AdvancedFilters
          filters={filters}
          onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
          onSaveFilter={(filter) => {
            const newFilter = { ...filter, id: Date.now().toString() }
            setSavedFilters([...savedFilters, newFilter])
            localStorage.setItem('savedFilters', JSON.stringify([...savedFilters, newFilter]))
          }}
          savedFilters={savedFilters}
        />

        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            placeholder="Search by asset symbol or name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="asset">Sort by Asset</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No transactions found"
            message="Try adjusting your filters or create a new transaction"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Portfolio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/portfolios/${tx.portfolioId}`} className="text-blue-600 hover:underline">
                          {portfolios.find((p) => p.id === tx.portfolioId)?.name || tx.portfolioId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{tx.assetSymbol}</div>
                        <div className="text-xs text-gray-500">{tx.assetName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            tx.transactionType === 'BUY' || tx.transactionType === 'DEPOSIT'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{parseFloat(tx.quantity).toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${parseFloat(tx.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${(parseFloat(tx.quantity) * parseFloat(tx.price) + parseFloat(tx.fee || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(0, filters.page - 1) })}
                  disabled={filters.page === 0}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {filters.page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(totalPages - 1, filters.page + 1) })}
                  disabled={filters.page >= totalPages - 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            fetchTransactions()
          }}
        />
      )}

      {deletingTransaction && (
        <>
          <ConfirmationDialog
            title="Delete Transaction"
            message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
            onConfirm={() => {
              setDeletingTransaction(null)
              // TransactionDeleteModal will handle the actual deletion
            }}
            onCancel={() => setDeletingTransaction(null)}
          />
          <TransactionDeleteModal
            transaction={deletingTransaction}
            onClose={() => setDeletingTransaction(null)}
            onSuccess={() => {
              setDeletingTransaction(null)
              fetchTransactions()
            }}
          />
        </>
      )}

      {showExportModal && (
        <ExportModal
          type="transactions"
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          type="transactions"
          portfolioId={filters.portfolioId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            fetchTransactions()
          }}
        />
      )}
    </div>
  )
}

export default TransactionListPage

