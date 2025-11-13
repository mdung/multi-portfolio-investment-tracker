import { useState } from 'react'
import api from '../api/axios'

const PortfolioDuplicateModal = ({ portfolio, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    copyTransactions: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post(`/portfolios/${portfolio.id}/duplicate`, {
        name: formData.name || undefined,
        copyTransactions: formData.copyTransactions
      })
      onSuccess(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to duplicate portfolio')
    } finally {
      setLoading(false)
    }
  }

  if (!portfolio) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Duplicate Portfolio</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Portfolio Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`${portfolio.name} (Copy)`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use "{portfolio.name} (Copy)"
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="copyTransactions"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.copyTransactions}
              onChange={(e) => setFormData({ ...formData, copyTransactions: e.target.checked })}
            />
            <label htmlFor="copyTransactions" className="ml-2 block text-sm text-gray-700">
              Copy transactions
            </label>
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
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Duplicating...' : 'Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PortfolioDuplicateModal

