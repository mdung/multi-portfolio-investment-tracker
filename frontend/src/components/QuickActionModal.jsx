import { useState, useEffect } from 'react'
import api from '../api/axios'

const QuickActionModal = ({ type, onClose, onSuccess, portfolioId }) => {
  const [portfolios, setPortfolios] = useState([])
  const [assets, setAssets] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseCurrency: 'USD',
    riskProfile: 'MODERATE',
    assetSymbol: '',
    assetId: '',
    transactionType: 'BUY',
    quantity: '',
    price: '',
    fee: '0',
    transactionDate: new Date().toISOString().slice(0, 16)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState(null)

  useEffect(() => {
    if (type === 'transaction' || type === 'portfolio') {
      fetchPortfolios()
    }
  }, [type])

  useEffect(() => {
    if (formData.assetSymbol && formData.assetSymbol.length >= 2) {
      searchAssets()
    }
  }, [formData.assetSymbol])

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data)
      if (portfolioId) {
        setFormData((prev) => ({ ...prev, portfolioId }))
      }
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
      const priceResponse = await api.get(`/market-data/asset/${asset.id}/price`)
      if (priceResponse.data?.price) {
        setSuggestedPrice(priceResponse.data.price)
        setFormData((prev) => ({ ...prev, price: priceResponse.data.price.toString() }))
      }
    } catch (error) {
      console.error('Failed to fetch price:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (type === 'portfolio') {
        const response = await api.post('/portfolios', {
          name: formData.name,
          description: formData.description,
          baseCurrency: formData.baseCurrency,
          riskProfile: formData.riskProfile
        })
        onSuccess(response.data)
      } else if (type === 'transaction') {
        if (!formData.assetId) {
          setError('Please select an asset')
          setLoading(false)
          return
        }
        await api.post('/transactions', {
          portfolioId: formData.portfolioId,
          assetId: formData.assetId,
          transactionType: formData.transactionType,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fee: parseFloat(formData.fee) || 0,
          transactionDate: new Date(formData.transactionDate).toISOString()
        })
        onSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to create ${type}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {type === 'portfolio' ? 'Create Portfolio' : 'Add Transaction'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'portfolio' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Currency</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.baseCurrency}
                    onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Profile</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.riskProfile}
                    onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value })}
                  >
                    <option value="CONSERVATIVE">Conservative</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="AGGRESSIVE">Aggressive</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioId}
                  onChange={(e) => setFormData({ ...formData, portfolioId: e.target.value })}
                >
                  <option value="">Select Portfolio</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
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
              {suggestedPrice && (
                <div className="text-sm text-green-600">
                  Suggested price: ${parseFloat(suggestedPrice).toFixed(2)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuickActionModal

