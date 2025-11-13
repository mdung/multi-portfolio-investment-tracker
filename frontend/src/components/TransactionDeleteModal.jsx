import { useState } from 'react'
import api from '../api/axios'

const TransactionDeleteModal = ({ transaction, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    try {
      await api.delete(`/transactions/${transaction.id}`)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction')
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Delete Transaction</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <p className="mb-4 text-gray-700">
          Are you sure you want to delete this transaction?
        </p>

        <div className="bg-gray-50 p-4 rounded mb-4">
          <div className="text-sm">
            <div className="font-medium">{transaction.assetSymbol}</div>
            <div className="text-gray-600">
              {transaction.transactionType} - {parseFloat(transaction.quantity).toFixed(4)} @ $
              {parseFloat(transaction.price).toFixed(2)}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {new Date(transaction.transactionDate).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionDeleteModal

