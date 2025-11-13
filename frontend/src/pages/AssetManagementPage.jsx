import { useState, useEffect } from 'react'
import api from '../api/axios'
import AssetCreationForm from '../components/AssetCreationForm'

const AssetManagementPage = () => {
  const [assets, setAssets] = useState([])
  const [popularAssets, setPopularAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    assetType: '',
    symbol: '',
    page: 0,
    size: 20
  })
  const [totalPages, setTotalPages] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)

  useEffect(() => {
    fetchAssets()
    fetchPopularAssets()
  }, [filters])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.assetType) params.append('assetType', filters.assetType)
      if (filters.symbol) params.append('symbol', filters.symbol)
      params.append('page', filters.page)
      params.append('size', filters.size)

      const response = await api.get(`/assets?${params.toString()}`)
      const data = response.data
      if (data.content) {
        setAssets(data.content)
        setTotalPages(data.totalPages)
      } else {
        setAssets(Array.isArray(data) ? data : [])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPopularAssets = async () => {
    try {
      const response = await api.get('/assets/popular')
      setPopularAssets(response.data)
    } catch (error) {
      console.error('Failed to fetch popular assets:', error)
    }
  }

  const handleDelete = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return
    }

    try {
      await api.delete(`/assets/${assetId}`)
      fetchAssets()
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('Failed to delete asset')
    }
  }

  const handleUpdate = async (assetId, updatedData) => {
    try {
      await api.put(`/assets/${assetId}`, updatedData)
      setEditingAsset(null)
      fetchAssets()
    } catch (error) {
      console.error('Failed to update asset:', error)
      alert('Failed to update asset')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Asset
        </button>
      </div>

      {popularAssets.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Popular Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularAssets.map((asset) => (
              <div key={asset.assetId} className="border rounded-lg p-3 text-center">
                <div className="font-semibold">{asset.assetSymbol}</div>
                <div className="text-xs text-gray-500">{asset.transactionCount} transactions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.assetType}
              onChange={(e) => setFilters({ ...filters, assetType: e.target.value, page: 0 })}
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.symbol}
              onChange={(e) => setFilters({ ...filters, symbol: e.target.value, page: 0 })}
              placeholder="Search by symbol..."
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assets found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{asset.symbol}</td>
                      <td className="px-4 py-3 text-sm">{asset.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {asset.assetType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {asset.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
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

      {showCreateForm && (
        <AssetCreationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchAssets()
          }}
        />
      )}

      {editingAsset && (
        <AssetCreationForm
          initialData={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={() => {
            setEditingAsset(null)
            fetchAssets()
          }}
        />
      )}
    </div>
  )
}

export default AssetManagementPage

