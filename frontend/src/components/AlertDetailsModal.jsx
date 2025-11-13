import api from '../api/axios'
import { useState, useEffect } from 'react'

const AlertDetailsModal = ({ alert, onClose }) => {
  const [currentPrice, setCurrentPrice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (alert) {
      fetchCurrentPrice()
    }
  }, [alert])

  const fetchCurrentPrice = async () => {
    try {
      const response = await api.get(`/market-data/asset/${alert.assetId}/price`)
      setCurrentPrice(response.data?.price)
    } catch (error) {
      console.error('Failed to fetch current price:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!alert) return null

  const priceDiff = currentPrice
    ? ((parseFloat(currentPrice) - parseFloat(alert.targetPrice)) / parseFloat(alert.targetPrice)) * 100
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Alert Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Asset</label>
            <div className="text-lg font-semibold">{alert.assetSymbol}</div>
            <div className="text-sm text-gray-600">{alert.assetName}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Condition</label>
              <div className="text-gray-900">
                {alert.conditionType === 'BELOW' ? 'Price Below' : 'Price Above'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Target Price</label>
              <div className="text-gray-900 font-semibold">
                {alert.currency} {parseFloat(alert.targetPrice).toFixed(2)}
              </div>
            </div>
          </div>

          {!loading && currentPrice && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Price</div>
              <div className="text-xl font-bold text-blue-600">
                {alert.currency} {parseFloat(currentPrice).toFixed(2)}
              </div>
              {priceDiff !== null && (
                <div className={`text-sm mt-1 ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(2)}% from target
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <span className={`px-2 py-1 text-xs rounded-full ${
                alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {alert.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Triggered</label>
              <div className="text-sm text-gray-900">
                {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : 'Not triggered'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
            <div className="text-sm text-gray-900">
              {new Date(alert.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertDetailsModal

