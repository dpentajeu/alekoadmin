# Aleko Admin Dashboard

A comprehensive admin dashboard built with React frontend and Node.js backend, featuring modern Material-UI design and responsive layout.

## Features

### 🔐 Authentication
- Secure admin login system
- JWT token-based authentication
- Role-based access control
- Password management

### 📊 Dashboard Overview
- Total users statistics
- New users this month
- Total balance across all users
- User growth trends
- Recent activity monitoring
- Top users by balance

### 👥 Referral Management
- Multi-level referral network visualization
- Referral statistics and analytics
- User referral tree view
- Referral level tracking
- Top referrers identification

### 💰 Balance Management
- User balance overview
- Balance adjustment capabilities
- Transaction history
- Balance distribution charts
- Export functionality (CSV/JSON)

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware

### Frontend
- **React 18** - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **date-fns** - Date utilities

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd AlekoAdmin
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

### 3. Environment Setup
```bash
# Copy environment example
cp backend/env.example backend/.env

# Edit the .env file with your configuration
nano backend/.env
```

Required environment variables:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/aleko_admin

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Admin credentials (for initial setup)
ADMIN_EMAIL=admin@aleko.com
ADMIN_PASSWORD=admin123
```

### 4. Start MongoDB
```bash
# Start MongoDB service
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the application
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only
npm run client
```

## Default Login Credentials

After first run, you can login with:
- **Email**: admin@aleko.com
- **Password**: admin123

**⚠️ Important**: Change these credentials after first login for security!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile
- `PUT /api/auth/profile` - Update admin profile
- `PUT /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/user-growth` - User growth data
- `GET /api/dashboard/balance-distribution` - Balance distribution

### Referral Management
- `GET /api/referral/networks` - Get referral networks
- `GET /api/referral/user/:userId` - Get specific user network
- `GET /api/referral/tree/:userId` - Get referral tree
- `GET /api/referral/statistics` - Referral statistics

### Balance Management
- `GET /api/balance/users` - Get user balances
- `GET /api/balance/user/:userId` - Get user balance details
- `PUT /api/balance/user/:userId/adjust` - Adjust user balance
- `GET /api/balance/statistics` - Balance statistics
- `GET /api/balance/export` - Export balance report

## Project Structure

```
AlekoAdmin/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md               # This file
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Starts development server
```

### Database Management
```bash
# Access MongoDB shell
mongosh

# Use database
use aleko_admin

# View collections
show collections

# View users
db.users.find().pretty()
```

## Production Deployment

### 1. Build frontend
```bash
cd frontend
npm run build
```

### 2. Set production environment
```bash
# Update .env file
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### 3. Start production server
```bash
cd backend
npm start
```

### 4. Use PM2 for process management (recommended)
```bash
npm install -g pm2
pm2 start server.js --name "aleko-admin"
pm2 startup
pm2 save
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation and sanitization
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

## Changelog

### v1.0.0
- Initial release
- Admin authentication system
- Dashboard with statistics
- Referral management
- Balance management
- Responsive Material-UI design
