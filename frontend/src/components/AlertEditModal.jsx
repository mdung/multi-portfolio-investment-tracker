import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const AlertEditModal = ({ alert, onClose, onSuccess }) => {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    assetId: '',
    assetSymbol: '',
    conditionType: 'BELOW',
    targetPrice: '',
    currency: 'USD'
  })
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (alert) {
      setFormData({
        assetId: alert.assetId,
        assetSymbol: alert.assetSymbol,
        conditionType: alert.conditionType,
        targetPrice: alert.targetPrice.toString(),
        currency: alert.currency
      })
    }
  }, [alert])

  useEffect(() => {
    if (formData.assetSymbol && formData.assetSymbol.length >= 2 && !formData.assetId) {
      searchAssets()
    } else {
      setAssets([])
    }
  }, [formData.assetSymbol])

  const searchAssets = async () => {
    try {
      const response = await api.get(`/market-data/search?query=${encodeURIComponent(formData.assetSymbol)}`)
      setAssets(response.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to search assets:', error)
    }
  }

  const handleAssetSelect = (asset) => {
    setFormData({ ...formData, assetId: asset.id, assetSymbol: asset.symbol })
    setAssets([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.assetId) {
      setError('Please select an asset')
      return
    }
    setLoading(true)
    setError('')

    try {
      await api.put(`/alerts/${alert.id}`, {
        assetId: formData.assetId,
        conditionType: formData.conditionType,
        targetPrice: parseFloat(formData.targetPrice),
        currency: formData.currency
      })
      showToast('Alert updated successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update alert')
      showToast(err.response?.data?.message || 'Failed to update alert', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!alert) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Edit Alert</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-gray-500">{asset.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.conditionType}
                onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
              >
                <option value="BELOW">Price Below</option>
                <option value="ABOVE">Price Above</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Price *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
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
              {loading ? 'Updating...' : 'Update Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AlertEditModal

