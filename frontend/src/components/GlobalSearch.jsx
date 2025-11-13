import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const GlobalSearch = ({ onClose }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState({
    portfolios: [],
    assets: [],
    transactions: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      performSearch()
    } else {
      setResults({ portfolios: [], assets: [], transactions: [] })
    }
  }, [searchTerm])

  const performSearch = async () => {
    setLoading(true)
    try {
      const [portfoliosRes, assetsRes, transactionsRes] = await Promise.all([
        api.get('/portfolios').catch(() => ({ data: [] })),
        api.get(`/market-data/search?query=${encodeURIComponent(searchTerm)}`).catch(() => ({ data: [] })),
        api.get(`/transactions?size=10`).catch(() => ({ data: { content: [] } }))
      ])

      const portfolios = portfoliosRes.data.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      const assets = assetsRes.data || []
      const transactions = Array.isArray(transactionsRes.data)
        ? transactionsRes.data
        : transactionsRes.data.content || []
      const filteredTransactions = transactions.filter((tx) =>
        tx.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.assetName?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      setResults({
        portfolios: portfolios.slice(0, 5),
        assets: assets.slice(0, 5),
        transactions: filteredTransactions.slice(0, 5)
      })
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (type, id) => {
    if (type === 'portfolio') {
      navigate(`/portfolios/${id}`)
    } else if (type === 'asset') {
      navigate(`/assets`)
    } else if (type === 'transaction') {
      navigate(`/transactions`)
    }
    onClose()
  }

  const totalResults = results.portfolios.length + results.assets.length + results.transactions.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Search portfolios, assets, transactions..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Searching...</div>
        ) : totalResults === 0 && searchTerm.length >= 2 ? (
          <div className="text-center py-8 text-gray-500">No results found</div>
        ) : (
          <div className="space-y-4">
            {results.portfolios.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Portfolios</h3>
                <div className="space-y-1">
                  {results.portfolios.map((portfolio) => (
                    <div
                      key={portfolio.id}
                      className="p-3 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleResultClick('portfolio', portfolio.id)}
                    >
                      <div className="font-medium">{portfolio.name}</div>
                      <div className="text-sm text-gray-500">{portfolio.description || 'No description'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.assets.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assets</h3>
                <div className="space-y-1">
                  {results.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-3 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleResultClick('asset', asset.id)}
                    >
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-gray-500">{asset.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.transactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Transactions</h3>
                <div className="space-y-1">
                  {results.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleResultClick('transaction', tx.id)}
                    >
                      <div className="font-medium">{tx.assetSymbol} - {tx.transactionType}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(tx.transactionDate).toLocaleDateString()} - {parseFloat(tx.quantity).toFixed(4)} @ ${parseFloat(tx.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GlobalSearch

