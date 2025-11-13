import { useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const ImportModal = ({ type, portfolioId, onClose, onSuccess }) => {
  const { showToast } = useToast()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error')
      return
    }

    setFile(selectedFile)
    setValidationErrors([])

    // Preview CSV
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split('\n').slice(0, 6) // Preview first 5 rows
      setPreview(lines)
      
      // Basic validation
      const errors = validateCSV(text)
      setValidationErrors(errors)
    }
    reader.readAsText(selectedFile)
  }

  const validateCSV = (csvText) => {
    const errors = []
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      errors.push('CSV must have at least a header row and one data row')
      return errors
    }

    // Check header (basic validation)
    const header = lines[0].toLowerCase()
    if (type === 'transactions') {
      const requiredFields = ['asset', 'type', 'quantity', 'price']
      requiredFields.forEach(field => {
        if (!header.includes(field)) {
          errors.push(`Missing required field: ${field}`)
        }
      })
    }

    // Validate data rows
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const fields = lines[i].split(',')
      if (fields.length < 4) {
        errors.push(`Row ${i + 1}: Insufficient columns`)
      }
    }

    return errors
  }

  const handleImport = async () => {
    if (!file) {
      showToast('Please select a file', 'error')
      return
    }

    if (validationErrors.length > 0) {
      showToast('Please fix validation errors before importing', 'error')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (portfolioId) {
        formData.append('portfolioId', portfolioId)
      }

      const endpoint = type === 'transactions' ? '/import/transactions' : '/import/portfolio'
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showToast(
        type === 'transactions' 
          ? `Imported ${response.data.message || 'transactions'} successfully`
          : 'Portfolio imported successfully',
        'success'
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to import:', error)
      showToast(error.response?.data?.message || 'Failed to import data', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Import {type === 'portfolio' ? 'Portfolio' : 'Transactions'}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV File *</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Select a CSV file to import. The file will be validated before import.
          </p>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm font-medium text-red-800 mb-1">Validation Errors:</div>
            <ul className="text-xs text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {preview && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                {preview.join('\n')}
              </pre>
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
            onClick={handleImport}
            disabled={loading || !file || validationErrors.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal

