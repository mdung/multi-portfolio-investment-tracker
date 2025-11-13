import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import AssetCreationForm from '../components/AssetCreationForm'

const WatchlistPage = () => {
  const { showToast } = useToast()
  const [watchlist, setWatchlist] = useState([])
  const [assets, setAssets] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      searchAssets()
    } else {
      setAssets([])
    }
  }, [searchTerm])

  const fetchWatchlist = async () => {
    setLoading(true)
    try {
      // For now, use localStorage for watchlist (would use backend in production)
      const saved = localStorage.getItem('watchlist')
      if (saved) {
        const assetIds = JSON.parse(saved)
        const promises = assetIds.map((id) => 
          api.get(`/assets/${id}`).catch(() => null)
        )
        const results = await Promise.all(promises)
        setWatchlist(results.filter((r) => r !== null).map((r) => r.data))
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchAssets = async () => {
    try {
      const response = await api.get(`/market-data/search?query=${encodeURIComponent(searchTerm)}`)
      setAssets(response.data.slice(0, 10))
    } catch (error) {
      console.error('Failed to search assets:', error)
    }
  }

  const addToWatchlist = async (asset) => {
    try {
      const saved = localStorage.getItem('watchlist')
      const assetIds = saved ? JSON.parse(saved) : []
      if (!assetIds.includes(asset.id)) {
        assetIds.push(asset.id)
        localStorage.setItem('watchlist', JSON.stringify(assetIds))
        setWatchlist([...watchlist, asset])
        showToast('Asset added to watchlist', 'success')
      } else {
        showToast('Asset already in watchlist', 'info')
      }
    } catch (error) {
      showToast('Failed to add to watchlist', 'error')
    }
  }

  const removeFromWatchlist = (assetId) => {
    const saved = localStorage.getItem('watchlist')
    const assetIds = saved ? JSON.parse(saved) : []
    const updated = assetIds.filter((id) => id !== assetId)
    localStorage.setItem('watchlist', JSON.stringify(updated))
    setWatchlist(watchlist.filter((a) => a.id !== assetId))
    showToast('Asset removed from watchlist', 'success')
  }

  const fetchPrices = async () => {
    try {
      const assetIds = watchlist.map((a) => a.id)
      const response = await api.post('/market-data/bulk', {
        assetIds,
        currency: 'USD'
      })
      // Update prices in watchlist
      const updated = watchlist.map((asset) => ({
        ...asset,
        currentPrice: response.data[asset.id] || asset.currentPrice
      }))
      setWatchlist(updated)
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchPrices}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Prices
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Asset
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search assets to add to watchlist..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {assets.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => addToWatchlist(asset)}
                >
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-gray-500">{asset.name}</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Add</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Watchlist is Empty</h3>
            <p className="text-gray-600 mb-4">Search for assets above to add them to your watchlist</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((asset) => (
              <div key={asset.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{asset.symbol}</h3>
                    <p className="text-sm text-gray-600">{asset.name}</p>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(asset.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
                {asset.currentPrice && (
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-600">
                      ${parseFloat(asset.currentPrice).toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Type: {asset.assetType}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <AssetCreationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={(asset) => {
            setShowCreateForm(false)
            addToWatchlist(asset)
          }}
        />
      )}
    </div>
  )
}

export default WatchlistPage

