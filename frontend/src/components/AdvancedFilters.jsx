import { useState } from 'react'

const AdvancedFilters = ({ filters, onFiltersChange, onSaveFilter, savedFilters = [] }) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterName, setFilterName] = useState('')

  const handleSaveFilter = () => {
    if (!filterName.trim()) return
    onSaveFilter({ name: filterName, filters })
    setFilterName('')
    setShowAdvanced(false)
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </button>
        {savedFilters.length > 0 && (
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1"
            onChange={(e) => {
              if (e.target.value) {
                const saved = savedFilters.find((f) => f.id === e.target.value)
                if (saved) {
                  onFiltersChange(saved.filters)
                }
              }
            }}
          >
            <option value="">Load Saved Filter</option>
            {savedFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {showAdvanced && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                value={filters.minAmount || ''}
                onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                value={filters.maxAmount || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxAmount: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.includeTransfers || false}
              onChange={(e) => onFiltersChange({ ...filters, includeTransfers: e.target.checked })}
              className="h-4 w-4"
            />
            <label className="text-sm text-gray-700">Include Transfer Transactions</label>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Filter name..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
            <button
              onClick={handleSaveFilter}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save Filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters

