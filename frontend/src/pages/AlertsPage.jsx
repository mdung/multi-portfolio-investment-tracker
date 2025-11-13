import { useEffect, useState } from 'react'
import api from '../api/axios'

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    assetSymbol: '',
    conditionType: 'BELOW',
    targetPrice: '',
    currency: 'USD'
  })

  useEffect(() => {
    fetchAlerts()
  }, [])

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

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      // In a real app, you'd search for the asset first
      // For demo purposes, we'll skip asset lookup
      alert('Asset lookup required. This is a simplified demo.')
      // await api.post('/alerts', {
      //   assetId: assetId,
      //   conditionType: formData.conditionType,
      //   targetPrice: parseFloat(formData.targetPrice),
      //   currency: formData.currency
      // })
      // setShowCreateForm(false)
      // setFormData({ assetSymbol: '', conditionType: 'BELOW', targetPrice: '', currency: 'USD' })
      // fetchAlerts()
    } catch (error) {
      console.error('Failed to create alert:', error)
      alert('Failed to create alert')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return
    }
    try {
      await api.delete(`/alerts/${id}`)
      fetchAlerts()
    } catch (error) {
      console.error('Failed to delete alert:', error)
      alert('Failed to delete alert')
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
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Alert'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create Price Alert</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Symbol *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.assetSymbol}
                onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                placeholder="e.g., BTC, AAPL"
              />
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

      {alerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No alerts yet. Create your first price alert.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    <button
                      onClick={() => handleToggle(alert.id, alert.isActive)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      {alert.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AlertsPage

