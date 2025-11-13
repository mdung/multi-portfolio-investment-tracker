import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const CorrelationPage = () => {
  const { id } = useParams()
  const { showToast } = useToast()
  const [portfolio, setPortfolio] = useState(null)
  const [correlation, setCorrelation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [portfolioRes, correlationRes] = await Promise.all([
        api.get(`/portfolios/${id}`),
        api.get(`/analytics/correlation?portfolioId=${id}`)
      ])
      setPortfolio(portfolioRes.data)
      setCorrelation(correlationRes.data)
    } catch (error) {
      console.error('Failed to fetch correlation data:', error)
      showToast('Failed to load correlation data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getCorrelationColor = (value) => {
    const num = parseFloat(value)
    if (num >= 0.7) return 'bg-red-500'
    if (num >= 0.3) return 'bg-yellow-500'
    if (num >= -0.3) return 'bg-green-500'
    if (num >= -0.7) return 'bg-blue-500'
    return 'bg-purple-500'
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const assets = correlation?.correlationMatrix ? Object.keys(correlation.correlationMatrix) : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Correlation</h1>
          <p className="text-gray-600">{portfolio?.name}</p>
        </div>
        <Link
          to={`/portfolios/${id}`}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back to Portfolio
        </Link>
      </div>

      {correlation && (
        <>
          {correlation.correlationMatrix && Object.keys(correlation.correlationMatrix).length > 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Correlation Matrix</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                      {assets.map((asset) => (
                        <th key={asset} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {asset}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset1) => (
                      <tr key={asset1}>
                        <td className="px-4 py-3 text-sm font-medium">{asset1}</td>
                        {assets.map((asset2) => {
                          const corr = correlation.correlationMatrix[asset1]?.[asset2]
                          const value = corr ? parseFloat(corr) : asset1 === asset2 ? 1 : 0
                          return (
                            <td key={asset2} className="px-4 py-3 text-center">
                              <div
                                className={`inline-block px-3 py-1 rounded text-white text-sm ${getCorrelationColor(value)}`}
                                title={`Correlation: ${value.toFixed(2)}`}
                              >
                                {value.toFixed(2)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>High (≥0.7)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Moderate (0.3-0.7)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Low (-0.3-0.3)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Negative (-0.7--0.3)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Very Negative (≤-0.7)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">Correlation analysis requires historical price data. Please ensure you have sufficient data.</p>
            </div>
          )}

          {correlation.topCorrelatedPairs && correlation.topCorrelatedPairs.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Top Correlated Pairs</h2>
              <div className="space-y-2">
                {correlation.topCorrelatedPairs.map((pair, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">
                      {pair.asset1Symbol} ↔ {pair.asset2Symbol}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {parseFloat(pair.correlation).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CorrelationPage

