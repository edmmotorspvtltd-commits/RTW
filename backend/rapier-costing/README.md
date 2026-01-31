# RAPIER COSTING BACKEND API

Complete Node.js backend for RTWE ERP Rapier Costing Calculator with PostgreSQL database.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Calculation Logic](#calculation-logic)
- [Project Structure](#project-structure)

## ✨ Features

- ✅ Complete CRUD operations for costing sheets
- ✅ Dynamic warp and weft configurations
- ✅ Real-time calculation engine with all 102 Excel formulas
- ✅ User authentication with JWT
- ✅ PostgreSQL database with relationships
- ✅ RESTful API design
- ✅ Input validation
- ✅ Error handling
- ✅ Pagination and filtering
- ✅ Activity logging
- ✅ Template management

## 🛠 Tech Stack

- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Database:** PostgreSQL (v13+)
- **ORM:** Sequelize
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcrypt, helmet, cors
- **Validation:** express-validator

## 📦 Prerequisites

Before you begin, ensure you have:

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn
- Git

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd rapier-costing-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapier_costing_db
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

## 🗄 Database Setup

### 1. Create PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE rapier_costing_db;
\q
```

### 2. Run the schema SQL file

```bash
psql -U postgres -d rapier_costing_db -f database-schema.sql
```

This will create all tables, indexes, triggers, and sample data.

### Database Schema Overview

The database includes:

- **users** - User accounts and authentication
- **parties** - Customer/party master data
- **brokers** - Broker master data
- **costing_sheets** - Main costing records
- **warp_configurations** - Warp parameters (1-to-many)
- **weft_configurations** - Weft parameters (1-to-many)
- **optional_charges** - Additional charges
- **cost_breakdown** - Detailed cost analysis
- **activity_log** - Audit trail
- **system_settings** - Application settings

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | rapier_costing_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | Token expiry | 7d |
| CORS_ORIGIN | Allowed origin | http://localhost:3000 |

## 🏃 Running the Application

### Development mode (with auto-reload)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server will start on `http://localhost:5000`

### Health check

```bash
curl http://localhost:5000/health
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/refresh         - Refresh token
GET    /api/auth/me              - Get current user
```

### Costing Sheets

```
GET    /api/costings             - Get all costings (paginated)
GET    /api/costings/:id         - Get single costing
POST   /api/costings             - Create new costing
PUT    /api/costings/:id         - Update costing
DELETE /api/costings/:id         - Delete costing
POST   /api/costings/calculate   - Calculate without saving
POST   /api/costings/:id/recalculate - Recalculate existing
```

### Master Data

```
GET    /api/parties              - Get all parties
POST   /api/parties              - Create party
PUT    /api/parties/:id          - Update party
DELETE /api/parties/:id          - Delete party

GET    /api/brokers              - Get all brokers
POST   /api/brokers              - Create broker
PUT    /api/brokers/:id          - Update broker
DELETE /api/brokers/:id          - Delete broker
```

### Templates

```
GET    /api/templates            - Get all templates
POST   /api/templates            - Create template
GET    /api/templates/:id        - Get template
DELETE /api/templates/:id        - Delete template
```

### System

```
GET    /api/settings             - Get system settings
PUT    /api/settings             - Update settings
```

## 📐 Calculation Logic

The calculation service implements all 102 formulas from the Excel sheet:

### Warp Calculations

```javascript
// DBF = Panna + RS Gap
calculateDBF(panna, rsGap)

// Total Ends = DBF × Reed
calculateTotalEnds(dbf, reed)

// Warp GLM = (Total Ends × 120/1852) / Warp Count / Crimping
calculateWarpGLM(totalEnds, warpCount, crimping)

// Warp Cost = Warp GLM × Rate (with 5% markup)
calculateWarpCostPerMeter(warpGLM, rate)
```

### Weft Calculations

```javascript
// Weft Consumption = RS × Pick × Insertion × 0.591 / Count / 1000
calculateWeftConsumption(rs, pick, insertion, weftCount)

// Total Weft GLM = Consumption + Wastage (5%)
calculateTotalWeftGLM(consumption, wastage)

// Weft Cost = Weft GLM × Rate (with 5% markup)
calculateWeftCostPerMeter(weftGLM, rate)
```

### Job Charges (Paisa Format)

```javascript
// Job Charges per Meter = Pick × Job Rate% / 100
calculateJobChargesPerMeter(pick, jobRatePercent)

// Job Charges per Pick = (Net Profit + Job Charges) / Pick
calculateJobChargesPerPick(netProfit, jobCharges, pick)
```

### Pricing

```javascript
// Production Cost = Sum of all costs
calculateProductionCost(costs)

// Min Selling Price = Production Cost + Expenses + Brokerage
calculateMinimumSellingPrice(...)

// Net Profit = Selling Price - All Costs
calculateNetProfit(...)
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js              # Database configuration
├── controllers/
│   ├── auth.controller.js       # Authentication logic
│   ├── costing.controller.js    # Costing CRUD operations
│   ├── party.controller.js      # Party management
│   └── broker.controller.js     # Broker management
├── models/
│   ├── User.js                  # User model
│   ├── CostingSheet.js          # Costing sheet model
│   ├── WarpConfiguration.js     # Warp config model
│   ├── WeftConfiguration.js     # Weft config model
│   ├── Party.js                 # Party model
│   └── Broker.js                # Broker model
├── routes/
│   ├── auth.routes.js           # Auth routes
│   ├── costing.routes.js        # Costing routes
│   ├── party.routes.js          # Party routes
│   └── broker.routes.js         # Broker routes
├── services/
│   └── calculation.service.js   # Calculation engine (102 formulas)
├── middleware/
│   ├── auth.middleware.js       # JWT authentication
│   └── validation.middleware.js # Input validation
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── server.js                    # Main server file
└── database-schema.sql          # PostgreSQL schema
```

## 🧮 Calculation Service API

### Complete Costing Calculation

```javascript
const CalculationService = require('./services/calculation.service');

const data = {
    orderLength: 24000,
    pickValue: 80,
    jobRatePercentage: 23,
    expensesPercentage: 5,
    brokeragePercentage: 1,
    vatavPercentage: 0,
    sellingPrice: 58.00,
    warps: [
        {
            panna: 63,
            rsGap: 4,
            reed: 132,
            warpCount: 40,
            rateOfYarn: 215,
            rateOfSizing: 28,
            crimping: 103,
            topBeamCharges: true,
            bobinCharges: false
        }
    ],
    wefts: [
        {
            rs: 66.8,
            pick: 80,
            insertion: 1,
            weftCount: 60,
            rateOfYarn: 218,
            percentageOfTotalWeft: 100,
            denier: 57.77,
            cottonRate: 0
        }
    ]
};

const result = CalculationService.calculateCompleteCost(data);

console.log(result);
// Returns complete calculations with warp, weft, totals, costs, and pricing
```

## 🔐 Authentication

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
    "username": "user123",
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "companyName": "ABC Textiles"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}

# Response
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
}
```

### Use Token

```bash
GET /api/costings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Example API Requests

### Create Costing Sheet

```bash
POST /api/costings
Authorization: Bearer <token>
Content-Type: application/json

{
    "orderNumber": "ORD-2026-001",
    "orderLength": 24000,
    "partyName": "ABC Textiles",
    "brokerName": "Textile Brokers Ltd",
    "qualityType": "Premium",
    "sizingSetNo": "SET-001",
    "pickValue": 80,
    "jobRatePercentage": 23,
    "sellingPrice": 58.00,
    "warps": [
        {
            "panna": 63,
            "rsGap": 4,
            "reed": 132,
            "warpCount": 40,
            "rateOfYarn": 215,
            "rateOfSizing": 28,
            "crimping": 103,
            "topBeamCharges": true,
            "bobinCharges": false
        }
    ],
    "wefts": [
        {
            "rs": 66.8,
            "pick": 80,
            "insertion": 1,
            "weftCount": 60,
            "rateOfYarn": 218,
            "percentageOfTotalWeft": 100,
            "denier": 57.77,
            "cottonRate": 0
        }
    ]
}
```

### Calculate Without Saving

```bash
POST /api/costings/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
    // Same data as above
}

# Response includes all calculations without saving
```

## 🐛 Error Handling

All API endpoints return consistent error responses:

```json
{
    "success": false,
    "message": "Error message here",
    "error": "Detailed error (development only)"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Notes

- All calculations match the Excel sheet exactly (102 formulas)
- Job charges are in paisa format (e.g., 0.28)
- Warp/Weft are dynamic (can add unlimited)
- All dates use timestamps with timezone
- Soft deletes can be implemented if needed

## 🔧 Maintenance

### Database Migrations

To modify the database schema:

1. Update `database-schema.sql`
2. Create migration script
3. Run migration on all environments

### Adding New Calculations

1. Add formula to `calculation.service.js`
2. Update calculation tests
3. Document the formula

## 📞 Support

For issues or questions:
- Email: support@rtwe-erp.com
- Documentation: See inline code comments

## 📄 License

Proprietary - RTWE ERP System

---

**Built with ❤️ for RTWE Textiles**
