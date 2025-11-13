import { useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const ExportModal = ({ type, id, name, onClose }) => {
  const { showToast } = useToast()
  const [format, setFormat] = useState('csv')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    portfolioId: id || '',
    assetId: '',
    transactionType: '',
    startDate: '',
    endDate: ''
  })

  const handleExport = async () => {
    setLoading(true)
    try {
      let url = ''
      let params = new URLSearchParams()

      if (type === 'transactions') {
        if (filters.portfolioId) params.append('portfolioId', filters.portfolioId)
        if (filters.assetId) params.append('assetId', filters.assetId)
        if (filters.transactionType) params.append('transactionType', filters.transactionType)
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        url = `/export/transactions?${params.toString()}`
      } else if (type === 'portfolio') {
        params.append('format', format)
        url = `/export/portfolio/${id}?${params.toString()}`
      }

      const response = await api.get(url, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      const extension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx'
      const filename = type === 'portfolio' 
        ? `portfolio_${name}_${new Date().toISOString().split('T')[0]}.${extension}`
        : `transactions_${new Date().toISOString().split('T')[0]}.${extension}`
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      showToast('Export completed successfully', 'success')
      onClose()
    } catch (error) {
      console.error('Failed to export:', error)
      showToast('Failed to export data', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Export {type === 'portfolio' ? 'Portfolio' : 'Transactions'}</h2>

        {type === 'portfolio' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="pdf" disabled>PDF (Coming Soon)</option>
              <option value="excel" disabled>Excel (Coming Soon)</option>
            </select>
          </div>
        )}

        {type === 'transactions' && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal

