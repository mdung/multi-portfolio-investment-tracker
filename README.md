# Multi-Portfolio Investment Tracker

A full-stack web application for tracking multiple investment portfolios containing stocks and cryptocurrencies.

## Architecture

- **Backend**: Spring Boot (Java 17) with JWT authentication
- **Frontend**: React 18 with TailwindCSS
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose

## Features

- ✅ User authentication (JWT)
- ✅ Multiple portfolios per user
- ✅ Support for stocks and cryptocurrencies
- ✅ Transaction management (Buy, Sell, Deposit, Withdraw, Transfer)
- ✅ Real-time price tracking (with mock providers)
- ✅ Portfolio analytics (P&L, allocation, performance)
- ✅ Price alerts
- ✅ Responsive UI with charts

## Prerequisites

- Docker and Docker Compose
- Java 17+ (for local development)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-portfolio-investment-tracker
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432

4. **Stop services**
   ```bash
   docker-compose down
   ```

## Local Development

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Backend will run on**: http://localhost:8080

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Frontend will run on**: http://localhost:3000

### Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE investtracker;
   ```

2. **Run schema script**
   ```bash
   psql -U postgres -d investtracker -f database/schema.sql
   ```

3. **Update application.yml** with your database credentials

## Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/investtracker
    username: postgres
    password: postgres

jwt:
  secret: your-256-bit-secret-key-change-this-in-production
  expiration: 86400000  # 24 hours
```

### Frontend Configuration

The frontend is configured to proxy API requests to `http://localhost:8080` in development mode (see `vite.config.js`).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Portfolios
- `GET /api/portfolios` - List user's portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/{id}` - Get portfolio details
- `PUT /api/portfolios/{id}` - Update portfolio
- `DELETE /api/portfolios/{id}` - Delete portfolio

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/portfolio/{portfolioId}` - List portfolio transactions

### Analytics
- `GET /api/analytics/portfolio/{id}/summary` - Portfolio summary
- `GET /api/analytics/portfolio/{id}/performance` - Performance metrics
- `GET /api/analytics/portfolio/{id}/allocation` - Asset allocation

### Market Data
- `GET /api/market-data/asset/{assetId}/price` - Get asset price

### Alerts
- `GET /api/alerts` - List user alerts
- `POST /api/alerts` - Create alert
- `DELETE /api/alerts/{id}` - Delete alert

## Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Project Structure

```
multi-portfolio-investment-tracker/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/investtracker/
│   │   │   │   ├── config/          # Configuration classes
│   │   │   │   ├── security/        # JWT & Security
│   │   │   │   ├── user/            # User management
│   │   │   │   ├── portfolio/       # Portfolio management
│   │   │   │   ├── asset/           # Asset management
│   │   │   │   ├── transaction/     # Transaction management
│   │   │   │   ├── marketdata/      # Price providers
│   │   │   │   ├── analytics/       # Analytics & reporting
│   │   │   │   └── alert/           # Price alerts
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/                    # Test files
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/                     # API client
│   │   ├── components/              # React components
│   │   ├── context/                 # Context providers
│   │   ├── pages/                   # Page components
│   │   └── main.jsx
│   └── package.json
├── database/
│   └── schema.sql                   # Database schema
├── docker-compose.yml
└── README.md
```

## Market Data Providers

The system uses an abstraction layer for price providers:

- **StockPriceProvider**: Mock implementation for stocks
- **CryptoPriceProvider**: Mock implementation for cryptocurrencies

To integrate real APIs:
1. Implement the `PriceProvider` interface
2. Add your provider as a Spring `@Component`
3. The `MarketDataService` will automatically use it

## Security

- JWT-based authentication
- Password hashing with BCrypt
- Role-based access control (USER, ADMIN)
- Ownership validation for portfolios and transactions
- CORS configuration for frontend

## Future Enhancements

- [ ] Real-time price updates via WebSocket
- [ ] Integration with real market data APIs (Alpha Vantage, CoinGecko)
- [ ] Email/SMS notifications for alerts
- [ ] Advanced charting and analytics
- [ ] Export portfolio data (CSV, PDF)
- [ ] Multi-currency support with conversion
- [ ] Tax reporting features
- [ ] Mobile app (React Native)

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

