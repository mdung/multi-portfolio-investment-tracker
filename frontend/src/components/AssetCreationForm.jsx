import { useState, useEffect } from 'react'
import api from '../api/axios'

const AssetCreationForm = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    assetType: 'STOCK',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        symbol: initialData.symbol || '',
        name: initialData.name || '',
        assetType: initialData.assetType || 'STOCK',
        description: initialData.description || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (initialData) {
        await api.put(`/assets/${initialData.id}`, formData)
      } else {
        await api.post('/assets', formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} asset`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{initialData ? 'Edit Asset' : 'Create Asset'}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., AAPL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Apple Inc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type *</label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.assetType}
            onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
          >
            <option value="STOCK">Stock</option>
            <option value="CRYPTO">Crypto</option>
            <option value="FOREX">Forex</option>
            <option value="COMMODITY">Commodity</option>
            <option value="BOND">Bond</option>
            <option value="ETF">ETF</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
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
            {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Asset' : 'Create Asset')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AssetCreationForm

