# Remaining Functionalities - Backend & Frontend

## 🔴 Backend (BE) - Missing Functionalities

### 1. User Management
- [ ] **GET /api/users/profile** - Get current user profile
- [ ] **PUT /api/users/profile** - Update user profile (name, email, base currency)
- [ ] **PUT /api/users/password** - Change password
- [ ] **GET /api/users/me** - Get current authenticated user details

### 2. Transaction Management
- [ ] **GET /api/transactions/{id}** - Get single transaction details
- [ ] **PUT /api/transactions/{id}** - Update transaction
- [ ] **DELETE /api/transactions/{id}** - Delete transaction
- [ ] **GET /api/transactions** - Get all user transactions (with filtering)
  - Query params: `portfolioId`, `assetId`, `transactionType`, `startDate`, `endDate`, `page`, `size`
- [ ] **GET /api/transactions/export** - Export transactions to CSV/PDF

### 3. Asset Management
- [ ] **POST /api/assets** - Create new asset (currently only search exists)
- [ ] **PUT /api/assets/{id}** - Update asset details
- [ ] **GET /api/assets** - List all assets (with pagination and filtering)
  - Query params: `assetType`, `symbol`, `page`, `size`
- [ ] **GET /api/assets/popular** - Get popular/most-used assets

### 4. Analytics & Performance
- [ ] **GET /api/analytics/portfolio/{id}/performance** - Time-series performance data
  - Return daily/weekly/monthly snapshots
  - Include: date, totalValue, totalCost, totalPnL, totalPnLPercent
- [ ] **GET /api/analytics/portfolio/{id}/history** - Portfolio value history
  - Store daily snapshots in price_snapshots or new portfolio_snapshots table
- [ ] **GET /api/analytics/portfolio/{id}/returns** - Calculate returns (daily, weekly, monthly, yearly)
- [ ] **GET /api/analytics/portfolio/{id}/risk-metrics** - Risk indicators
  - Portfolio concentration (top 5 assets %)
  - Volatility calculation
  - Sharpe ratio (if historical data available)
- [ ] **GET /api/analytics/dashboard** - Aggregated dashboard data
  - Total net worth across all portfolios
  - Overall P&L
  - Top performing assets
  - Recent transactions

### 5. Market Data
- [ ] **POST /api/market-data/bulk** - Fetch prices for multiple assets at once
- [ ] **GET /api/market-data/asset/{id}/history** - Historical price data
  - Query params: `startDate`, `endDate`, `interval` (daily, weekly, monthly)
- [ ] **GET /api/market-data/search** - Search for assets by symbol/name
- [ ] **POST /api/market-data/refresh** - Manually refresh prices for a portfolio

### 6. Portfolio Features
- [ ] **GET /api/portfolios/{id}/snapshot** - Create portfolio snapshot (for history)
- [ ] **POST /api/portfolios/{id}/duplicate** - Duplicate/clone portfolio
- [ ] **GET /api/portfolios/{id}/export** - Export portfolio to CSV/PDF
- [ ] **GET /api/portfolios/{id}/transactions** - Get all transactions (already exists but could be enhanced)

### 7. Alerts Enhancement
- [ ] **PUT /api/alerts/{id}** - Update alert (currently only toggle exists)
- [ ] **GET /api/alerts/{id}** - Get single alert details
- [ ] **POST /api/alerts/bulk** - Create multiple alerts at once
- [ ] **GET /api/alerts/triggered** - Get all triggered alerts
- [ ] **POST /api/alerts/{id}/reset** - Reset triggered alert (reactivate)

### 8. Data Export & Import
- [ ] **GET /api/export/transactions** - Export all transactions to CSV
- [ ] **GET /api/export/portfolio/{id}** - Export portfolio to CSV/PDF
- [ ] **POST /api/import/transactions** - Import transactions from CSV
- [ ] **POST /api/import/portfolio** - Import portfolio from CSV

### 9. Advanced Features
- [ ] **GET /api/reports/tax** - Tax reporting (realized gains/losses)
- [ ] **GET /api/reports/performance** - Performance report
- [ ] **POST /api/portfolios/{id}/rebalance** - Portfolio rebalancing suggestions
- [ ] **GET /api/analytics/correlation** - Asset correlation analysis

### 10. Admin Features (if needed)
- [ ] **GET /api/admin/users** - List all users (admin only)
- [ ] **PUT /api/admin/users/{id}/enable** - Enable/disable user
- [ ] **GET /api/admin/assets** - Manage assets (admin)
- [ ] **POST /api/admin/assets/bulk** - Bulk create assets

### 11. Validation & Error Handling
- [ ] Better validation for transaction dates (not in future for most types)
- [ ] Validation for transfer transactions (both portfolios must exist)
- [ ] Better error messages and error codes
- [ ] Rate limiting for API endpoints

### 12. Caching & Performance
- [ ] Redis integration for price caching
- [ ] Cache portfolio summaries
- [ ] Async price updates

---

## 🟡 Frontend (FE) - Missing Functionalities

### 1. User Profile Management
- [ ] **UserProfilePage** - View and edit user profile
  - Display: username, email, name, base currency
  - Edit profile form
  - Change password form
  - Account settings

### 2. Transaction Management UI
- [ ] **Transaction Edit** - Edit existing transactions
  - Modal/form to edit transaction details
  - Validation for quantity/price changes
- [ ] **Transaction Delete** - Delete transactions with confirmation
- [ ] **Transaction List Page** - Dedicated page for all transactions
  - Filtering: by portfolio, asset, type, date range
  - Sorting: by date, amount, asset
  - Pagination
  - Search functionality
- [ ] **Transaction Details View** - View full transaction details
- [ ] **Bulk Transaction Import** - CSV import functionality

### 3. Asset Management UI
- [ ] **AssetSearchPage** - Search and browse assets
  - Search by symbol/name
  - Filter by type (STOCK, CRYPTO)
  - Asset details view
  - Add to watchlist (if implemented)
- [ ] **Asset Creation Form** - Create custom assets
  - Form with all asset fields
  - Validation
- [ ] **Asset Management Page** - List and manage assets
  - View all assets used in portfolios
  - Edit asset details
  - Popular assets section

### 4. Portfolio Enhancements
- [ ] **Portfolio Edit** - Inline editing on detail page
- [ ] **Portfolio Duplicate** - Clone portfolio functionality
- [ ] **Portfolio Export** - Export to CSV/PDF button
- [ ] **Portfolio Comparison** - Compare multiple portfolios side-by-side
- [ ] **Portfolio Templates** - Pre-configured portfolio templates

### 5. Analytics & Charts
- [ ] **Performance Chart** - Time-series chart showing portfolio value over time
  - Daily/weekly/monthly views
  - Multiple portfolios comparison
  - Interactive date range selector
- [ ] **Returns Analysis** - Detailed returns breakdown
  - Daily/weekly/monthly/yearly returns
  - Cumulative returns chart
- [ ] **Allocation Charts** - Enhanced allocation visualization
  - Pie chart by asset type
  - Bar chart by individual assets
  - Treemap visualization
- [ ] **Risk Metrics Dashboard** - Display risk indicators
  - Portfolio concentration
  - Volatility metrics
  - Risk score
- [ ] **Asset Performance Chart** - Individual asset performance over time

### 6. Dashboard Enhancements
- [ ] **Real-time Updates** - WebSocket integration for live price updates
- [ ] **Widget System** - Customizable dashboard widgets
- [ ] **Quick Actions** - Quick add transaction, create portfolio
- [ ] **Recent Activity Feed** - Show recent transactions, alerts triggered
- [ ] **Summary Cards** - Enhanced summary cards with more metrics
- [ ] **Portfolio Quick View** - Mini portfolio cards on dashboard

### 7. Alerts UI Completion
- [ ] **Complete Alert Creation** - Fix the commented-out alert creation
  - Asset search/selection
  - Form validation
  - Success/error handling
- [ ] **Alert Edit** - Edit existing alerts
- [ ] **Alert Details** - View alert details and history
- [ ] **Triggered Alerts View** - Dedicated view for triggered alerts
- [ ] **Alert Notifications** - Toast notifications when alerts trigger
- [ ] **Alert Management** - Bulk activate/deactivate

### 8. Transaction Form Enhancements
- [ ] **Asset Autocomplete** - Search and select assets with autocomplete
- [ ] **Price Suggestion** - Auto-fill current price from market data
- [ ] **Transaction Templates** - Save common transaction patterns
- [ ] **Transfer UI** - Better UI for transfer transactions
  - Select source and destination portfolios
  - Validation
- [ ] **Transaction History** - Show transaction history for an asset in portfolio

### 9. Data Export/Import
- [ ] **Export Button** - Export transactions/portfolio to CSV
- [ ] **Import Modal** - CSV import with preview
- [ ] **Export Options** - Choose format (CSV, PDF, Excel)
- [ ] **Import Validation** - Validate imported data before saving

### 10. UI/UX Improvements
- [ ] **Loading States** - Better loading indicators (skeletons, spinners)
- [ ] **Error Handling** - User-friendly error messages
- [ ] **Toast Notifications** - Success/error toast notifications
- [ ] **Confirmation Dialogs** - Confirm destructive actions
- [ ] **Empty States** - Better empty state designs
- [ ] **Responsive Design** - Mobile optimization
- [ ] **Dark Mode** - Theme toggle
- [ ] **Accessibility** - ARIA labels, keyboard navigation

### 11. Advanced Features
- [ ] **Portfolio Rebalancing** - UI for rebalancing suggestions
- [ ] **Tax Reporting** - Tax report generation and display
- [ ] **Performance Reports** - Generate and view performance reports
- [ ] **Asset Correlation** - Correlation matrix visualization
- [ ] **Watchlist** - Watch assets without adding to portfolio

### 12. Settings & Preferences
- [ ] **Settings Page** - Application settings
  - Default currency
  - Date format
  - Number format
  - Chart preferences
  - Notification preferences

### 13. Search & Filtering
- [ ] **Global Search** - Search across portfolios, assets, transactions
- [ ] **Advanced Filters** - Complex filtering with multiple criteria
- [ ] **Saved Filters** - Save frequently used filter combinations
- [ ] **Sort Options** - Multiple sort options for lists

### 14. Mobile App Features (if React Native)
- [ ] Mobile-optimized UI
- [ ] Push notifications for alerts
- [ ] Offline mode
- [ ] Biometric authentication

---

## 🔵 Integration & Infrastructure

### Backend
- [ ] **Real API Integration** - Replace mock price providers with real APIs
  - Alpha Vantage for stocks
  - CoinGecko/CoinMarketCap for crypto
- [ ] **WebSocket Support** - Real-time price updates
- [ ] **Scheduled Jobs** - Daily portfolio snapshots
- [ ] **Email Notifications** - Email alerts when price alerts trigger
- [ ] **Logging & Monitoring** - Proper logging and monitoring setup
- [ ] **API Documentation** - Swagger/OpenAPI documentation

### Frontend
- [ ] **Service Worker** - PWA support for offline functionality
- [ ] **Error Boundary** - React error boundaries for better error handling
- [ ] **Performance Optimization** - Code splitting, lazy loading
- [ ] **Analytics** - User analytics integration
- [ ] **SEO** - Meta tags, structured data (if public pages)

---

## 📊 Priority Recommendations

### High Priority (Core Functionality)
1. ✅ User profile management (BE + FE)
2. ✅ Transaction edit/delete (BE + FE)
3. ✅ Asset creation endpoint (BE)
4. ✅ Complete alert creation (FE)
5. ✅ Performance time-series data (BE + FE)
6. ✅ Transaction filtering (BE + FE)

### Medium Priority (Enhanced UX)
1. Portfolio export/import
2. Better charts and analytics
3. Dashboard enhancements
4. Error handling improvements

### Low Priority (Nice to Have)
1. Admin features
2. Advanced analytics
3. Mobile app
4. Tax reporting

---

## 📝 Notes

- Some features are partially implemented (e.g., alert creation is commented out in FE)
- Performance endpoint exists but just returns summary - needs time-series data
- Asset creation is missing - currently only search exists
- Transaction management is basic - needs edit/delete functionality
- User profile management is completely missing

