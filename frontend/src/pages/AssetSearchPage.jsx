import { useState, useEffect } from 'react'
import api from '../api/axios'
import AssetCreationForm from '../components/AssetCreationForm'

const AssetSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [assets, setAssets] = useState([])
  const [filteredAssets, setFilteredAssets] = useState([])
  const [assetType, setAssetType] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    filterAssets()
  }, [searchTerm, assetType, assets])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const response = await api.get('/assets?size=1000')
      const data = response.data.content || response.data
      setAssets(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchAssets()
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/market-data/search?query=${encodeURIComponent(searchTerm)}`)
      setAssets(response.data)
    } catch (error) {
      console.error('Failed to search assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    let filtered = assets

    if (assetType) {
      filtered = filtered.filter((asset) => asset.assetType === assetType)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.symbol?.toLowerCase().includes(term) ||
          asset.name?.toLowerCase().includes(term)
      )
    }

    setFilteredAssets(filtered)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Asset Search</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Asset
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Search by symbol or name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="STOCK">Stock</option>
            <option value="CRYPTO">Crypto</option>
            <option value="FOREX">Forex</option>
            <option value="COMMODITY">Commodity</option>
            <option value="BOND">Bond</option>
            <option value="ETF">ETF</option>
            <option value="OTHER">Other</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assets found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{asset.symbol}</h3>
                    <p className="text-sm text-gray-600">{asset.name}</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {asset.assetType}
                  </span>
                </div>
                {asset.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{asset.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsset && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedAsset.symbol}</h2>
              <p className="text-gray-600">{selectedAsset.name}</p>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
              <div className="text-gray-900">{selectedAsset.assetType}</div>
            </div>
            {selectedAsset.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <div className="text-gray-900">{selectedAsset.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <AssetCreationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchAssets()
          }}
        />
      )}
    </div>
  )
}

export default AssetSearchPage

