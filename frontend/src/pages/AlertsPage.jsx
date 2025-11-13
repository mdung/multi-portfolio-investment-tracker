import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import AlertEditModal from '../components/AlertEditModal'
import AlertDetailsModal from '../components/AlertDetailsModal'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ConfirmationDialog from '../components/ConfirmationDialog'

const AlertsPage = () => {
  const { showToast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [triggeredAlerts, setTriggeredAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'active', 'triggered'
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)
  const [viewingAlert, setViewingAlert] = useState(null)
  const [assets, setAssets] = useState([])
  const [formData, setFormData] = useState({
    assetId: '',
    assetSymbol: '',
    conditionType: 'BELOW',
    targetPrice: '',
    currency: 'USD'
  })

  useEffect(() => {
    fetchAlerts()
    fetchTriggeredAlerts()
  }, [])

  useEffect(() => {
    if (formData.assetSymbol && formData.assetSymbol.length >= 2) {
      searchAssets()
    } else {
      setAssets([])
    }
  }, [formData.assetSymbol])

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts')
      setAlerts(response.data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTriggeredAlerts = async () => {
    try {
      const response = await api.get('/alerts/triggered')
      setTriggeredAlerts(response.data)
    } catch (error) {
      console.error('Failed to fetch triggered alerts:', error)
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

  const handleAssetSelect = (asset) => {
    setFormData({ ...formData, assetId: asset.id, assetSymbol: asset.symbol })
    setAssets([])
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.assetId) {
      showToast('Please select an asset', 'error')
      return
    }
    try {
      await api.post('/alerts', {
        assetId: formData.assetId,
        conditionType: formData.conditionType,
        targetPrice: parseFloat(formData.targetPrice),
        currency: formData.currency
      })
      setShowCreateForm(false)
      setFormData({ assetId: '', assetSymbol: '', conditionType: 'BELOW', targetPrice: '', currency: 'USD' })
      fetchAlerts()
      fetchTriggeredAlerts()
      showToast('Alert created successfully', 'success')
    } catch (error) {
      console.error('Failed to create alert:', error)
      showToast(error.response?.data?.message || 'Failed to create alert', 'error')
    }
  }

  const handleBulkToggle = async (alertIds, isActive) => {
    try {
      await Promise.all(
        alertIds.map((id) => api.put(`/alerts/${id}/toggle?active=${isActive}`))
      )
      fetchAlerts()
      fetchTriggeredAlerts()
      showToast(`Alerts ${isActive ? 'activated' : 'deactivated'} successfully`, 'success')
    } catch (error) {
      console.error('Failed to bulk toggle alerts:', error)
      showToast('Failed to update alerts', 'error')
    }
  }

  const handleReset = async (id) => {
    try {
      await api.post(`/alerts/${id}/reset`)
      fetchAlerts()
      fetchTriggeredAlerts()
      showToast('Alert reset successfully', 'success')
    } catch (error) {
      console.error('Failed to reset alert:', error)
      showToast('Failed to reset alert', 'error')
    }
  }

  const displayedAlerts = activeTab === 'triggered' 
    ? triggeredAlerts 
    : activeTab === 'active'
    ? alerts.filter((a) => a.isActive)
    : alerts

  const [selectedAlerts, setSelectedAlerts] = useState([])
  const [deletingAlert, setDeletingAlert] = useState(null)

  const handleDelete = (id) => {
    setDeletingAlert(id)
  }

  const confirmDelete = async () => {
    if (!deletingAlert) return
    try {
      await api.delete(`/alerts/${deletingAlert}`)
      fetchAlerts()
      fetchTriggeredAlerts()
      setDeletingAlert(null)
      showToast('Alert deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete alert:', error)
      showToast('Failed to delete alert', 'error')
    }
  }

  const handleToggle = async (id, isActive) => {
    try {
      await api.put(`/alerts/${id}/toggle?active=${!isActive}`)
      fetchAlerts()
    } catch (error) {
      console.error('Failed to toggle alert:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  // Listen for alert triggers (would use WebSocket in production)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTriggeredAlerts()
    }, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create Alert'}
          </button>
          {selectedAlerts.length > 0 && (
            <>
              <button
                onClick={() => handleBulkToggle(selectedAlerts, true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Activate Selected
              </button>
              <button
                onClick={() => handleBulkToggle(selectedAlerts, false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Deactivate Selected
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({alerts.filter((a) => a.isActive).length})
            </button>
            <button
              onClick={() => setActiveTab('triggered')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'triggered'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Triggered ({triggeredAlerts.length})
            </button>
          </nav>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create Price Alert</h2>
          <form onSubmit={handleCreate} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Condition *</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                >
                  <option value="BELOW">Price Below</option>
                  <option value="ABOVE">Price Above</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Price *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="VND">VND</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Alert
            </button>
          </form>
        </div>
      )}

      {displayedAlerts.length === 0 ? (
        <EmptyState
          icon={activeTab === 'triggered' ? '🔔' : '📊'}
          title={activeTab === 'triggered' ? 'No triggered alerts' : 'No alerts yet'}
          message={activeTab === 'triggered' 
            ? 'You don\'t have any triggered alerts at the moment'
            : 'Create your first price alert to get notified when assets reach target prices'}
          actionLabel={activeTab === 'triggered' ? null : 'Create Alert'}
          onAction={activeTab === 'triggered' ? null : () => setShowCreateForm(true)}
        />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === displayedAlerts.length && displayedAlerts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAlerts(displayedAlerts.map((a) => a.id))
                      } else {
                        setSelectedAlerts([])
                      }
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlerts([...selectedAlerts, alert.id])
                        } else {
                          setSelectedAlerts(selectedAlerts.filter((id) => id !== alert.id))
                        }
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => setViewingAlert(alert)}
                  >
                    <div className="text-sm font-medium text-gray-900">{alert.assetSymbol}</div>
                    <div className="text-sm text-gray-500">{alert.assetName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.conditionType === 'BELOW' ? 'Below' : 'Above'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {alert.currency} {parseFloat(alert.targetPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {alert.triggeredAt && (
                        <button
                          onClick={() => handleReset(alert.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Reset alert"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setEditingAlert(alert)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(alert.id, alert.isActive)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        {alert.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="text-red-600 hover:text-red-900"
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
      )}

      {editingAlert && (
        <AlertEditModal
          alert={editingAlert}
          onClose={() => setEditingAlert(null)}
          onSuccess={() => {
            setEditingAlert(null)
            fetchAlerts()
            fetchTriggeredAlerts()
          }}
        />
      )}

      {viewingAlert && (
        <AlertDetailsModal
          alert={viewingAlert}
          onClose={() => setViewingAlert(null)}
        />
      )}

      {deletingAlert && (
        <ConfirmationDialog
          title="Delete Alert"
          message="Are you sure you want to delete this price alert? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingAlert(null)}
        />
      )}
    </div>
  )
}

export default AlertsPage

