import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const PortfolioListPage = () => {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseCurrency: 'USD',
    riskProfile: 'MODERATE'
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/portfolios')
      setPortfolios(response.data)
    } catch (error) {
      console.error('Failed to fetch portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/portfolios', formData)
      setShowCreateForm(false)
      setFormData({ name: '', description: '', baseCurrency: 'USD', riskProfile: 'MODERATE' })
      fetchPortfolios()
      navigate(`/portfolios/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create portfolio:', error)
      alert('Failed to create portfolio')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio?')) {
      return
    }
    try {
      await api.delete(`/portfolios/${id}`)
      fetchPortfolios()
    } catch (error) {
      console.error('Failed to delete portfolio:', error)
      alert('Failed to delete portfolio')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
        <div className="flex space-x-2">
          <Link
            to="/portfolios/compare"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Compare Portfolios
          </Link>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create Portfolio'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Portfolio</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Currency</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.baseCurrency}
                  onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="VND">VND</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Risk Profile</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.riskProfile}
                  onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value })}
                >
                  <option value="CONSERVATIVE">Conservative</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Portfolio
            </button>
          </form>
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No portfolios yet. Create your first portfolio to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <Link
                  to={`/portfolios/${portfolio.id}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                >
                  {portfolio.name}
                </Link>
                <button
                  onClick={() => handleDelete(portfolio.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{portfolio.description || 'No description'}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Currency: {portfolio.baseCurrency}</div>
                {portfolio.riskProfile && (
                  <div>Risk: {portfolio.riskProfile}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PortfolioListPage

