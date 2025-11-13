# Multi-Portfolio Investment Tracker - Architecture

## High-Level Architecture

### System Overview

The Multi-Portfolio Investment Tracker is a full-stack web application that allows users to manage multiple investment portfolios containing stocks and cryptocurrencies. The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ReactJS + TailwindCSS                                       │
│  - Dashboard, Portfolio Management, Analytics, Alerts       │
│  - JWT-based authentication                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────┴──────────────────────────────────────┐
│                     Backend Layer                            │
│  Spring Boot (Java 17)                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   REST API   │  │   Security   │  │   Services   │      │
│  │  Controllers │  │   (JWT)       │  │   Layer      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│  ┌──────┴─────────────────┴──────────────────┴───────┐      │
│  │              Repository Layer (JPA)                │      │
│  └──────────────────────┬─────────────────────────────┘      │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Database Layer                            │
│  PostgreSQL                                                  │
│  - Users, Portfolios, Assets, Transactions                  │
│  - Price Snapshots, Alerts                                  │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│              External Services Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Stock Price API  │  │ Crypto Price API │                │
│  │  (Abstracted)    │  │  (Abstracted)    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Main Modules/Layers

#### 1. API Layer (Controllers)
- **AuthController**: Handles registration, login, JWT token generation
- **PortfolioController**: CRUD operations for portfolios
- **TransactionController**: Manage buy/sell/deposit/withdraw/transfer transactions
- **AssetController**: Asset management and lookup
- **AnalyticsController**: Portfolio analytics, performance, allocation
- **MarketDataController**: Price fetching and market data
- **AlertController**: Price alert management

#### 2. Service Layer
- **UserService**: User registration, authentication, profile management
- **PortfolioService**: Portfolio CRUD, ownership validation
- **AssetService**: Asset creation, lookup, validation
- **TransactionService**: Transaction processing, holdings calculation
- **MarketDataService**: Price fetching, caching, aggregation
- **AnalyticsService**: Portfolio valuation, P&L calculation, performance metrics
- **AlertService**: Alert creation, evaluation, notification

#### 3. Repository Layer (JPA)
- Spring Data JPA repositories for all entities
- Custom queries for complex operations (holdings, performance, etc.)
- Transaction management

#### 4. Security/Auth Layer
- **JWT Authentication**: Token-based stateless authentication
- **Spring Security**: Role-based access control (USER, ADMIN)
- **Password Encoding**: BCrypt for password hashing
- **Security Filters**: JWT validation on protected endpoints
- **Ownership Validation**: Users can only access their own portfolios/transactions

#### 5. Price Provider Integration Layer
- **PriceProvider Interface**: Abstraction for different price sources
- **StockPriceProvider**: Implementation for stock prices (mock/stub)
- **CryptoPriceProvider**: Implementation for crypto prices (mock/stub)
- **MarketDataService**: Orchestrates price fetching, caching, and aggregation
- **Price Cache**: In-memory or database caching for price data

### Technology Stack

**Backend:**
- Java 17
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL Driver
- Maven

**Frontend:**
- React 18+
- TailwindCSS
- Axios (HTTP client)
- React Router (routing)
- Recharts (charts)
- React Context API (state management)

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15+
- Nginx (for serving React build)

### Data Flow

1. **User Authentication:**
   - User logs in → Backend validates credentials → Returns JWT token
   - Frontend stores JWT in localStorage
   - Subsequent requests include JWT in Authorization header

2. **Portfolio Management:**
   - User creates portfolio → Backend validates ownership → Saves to DB
   - User adds transaction → Backend calculates holdings → Updates portfolio value

3. **Price Updates:**
   - MarketDataService fetches prices from providers
   - Prices cached for performance
   - Portfolio valuation recalculated using latest prices

4. **Analytics:**
   - AnalyticsService aggregates transactions and prices
   - Calculates P&L, allocation, performance metrics
   - Returns formatted data for frontend charts

### Security Considerations

- JWT tokens expire after 24 hours (configurable)
- Passwords hashed with BCrypt (strength 10)
- API endpoints protected by Spring Security
- Ownership validation ensures users can only access their data
- CORS configured for frontend domain
- SQL injection prevention via JPA parameterized queries

### Scalability Considerations

- Price provider abstraction allows easy addition of new sources
- Caching layer reduces external API calls
- Database indexes on frequently queried fields
- Stateless JWT authentication enables horizontal scaling
- Service layer separation allows independent scaling

