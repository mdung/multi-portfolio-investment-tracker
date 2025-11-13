import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../Layout'
import { AuthProvider } from '../../context/AuthContext'

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => ({
    user: { username: 'testuser' },
    logout: jest.fn(),
    isAuthenticated: true
  })
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Layout', () => {
  it('renders navigation links', () => {
    renderWithRouter(<Layout><div>Test Content</div></Layout>)
    
    expect(screen.getByText('Investment Tracker')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Portfolios')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
  })
  
  it('renders user username', () => {
    renderWithRouter(<Layout><div>Test Content</div></Layout>)
    
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
  
  it('renders logout button', () => {
    renderWithRouter(<Layout><div>Test Content</div></Layout>)
    
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
  
  it('renders children content', () => {
    renderWithRouter(<Layout><div>Test Content</div></Layout>)
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

