# Kisaan Center Frontend

Enterprise-grade React + TypeScript frontend for the Market Management System.

## 🚀 Features

- **Feature-based Architecture**: Modular design with domain-driven structure
- **Role-based Access Control**: Dynamic UI based on user roles (SUPERADMIN, OWNER, FARMER, BUYER, EMPLOYEE)
- **Three-party Transaction Model**: Complete transaction lifecycle management
- **Real-time Updates**: Live transaction status updates
- **Responsive Design**: Mobile-first responsive design
- **Type Safety**: Full TypeScript implementation with strict mode
- **Modern UI**: Clean design with TailwindCSS and Lucide icons

## 🏗️ Architecture

```
src/
├── app/                    # App-level setup (routing, providers)
├── features/               # Feature modules (auth, user, transaction, etc.)
│   ├── auth/              # Authentication & session management
│   ├── user/              # User management
│   ├── transaction/       # Transaction processing
│   └── ...                # Other features
├── components/            # Shared UI components
│   ├── ui/               # Basic components (Button, Input, etc.)
│   ├── layout/           # Layout components (Header, Sidebar)
│   └── forms/            # Form components
├── hooks/                # Global custom hooks
├── services/             # API clients & utilities
├── context/              # Global context providers
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
└── pages/                # Top-level route pages
```

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Query** for API state management
- **React Router** for routing
- **Zustand** for global state
- **React Hook Form** for form handling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Authentication

The app supports role-based authentication with the following roles:

- **SUPERADMIN**: Full system access
- **OWNER**: Shop management and oversight
- **EMPLOYEE**: Transaction processing
- **FARMER**: Stock management and payment tracking
- **BUYER**: Purchase history and credit management

## 🎯 Key Features

### Dashboard
- Role-specific dashboards with relevant metrics
- Real-time data updates
- Performance indicators and alerts

### User Management
- CRUD operations for all user types
- Role-based permissions
- Credit limit management

### Transaction Processing
- Three-party completion model (Buyer + Farmer + Commission)
- Real-time status tracking
- Commission confirmation workflow
- Payment and credit integration

### Stock Management
- Farmer stock entry and adjustments
- Real-time stock tracking
- Stock availability validation

### Payment System
- Multiple payment methods
- Partial payment support
- Credit management with limits

## 🔧 Development

### Adding New Features

1. Create feature directory in `src/features/`
2. Add components, hooks, API, and types
3. Export from `index.ts`
4. Add routes in `App.tsx`
5. Update navigation in `Sidebar.tsx`

### API Integration

All API calls go through the centralized `apiClient` with:
- Automatic token handling
- Error handling and toast notifications
- Request/response interceptors
- TypeScript type safety

### State Management

- **React Query**: Server state and caching
- **Context API**: Authentication and global state
- **Local State**: Component-specific state with useState/useReducer

## 🎨 Styling

- **TailwindCSS**: Utility-first CSS framework
- **Custom Design System**: Consistent colors, typography, and spacing
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Theme system in place

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔒 Security

- JWT token authentication
- Role-based access control
- Input validation and sanitization
- XSS protection
- Secure API communication

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS S3, etc.)
```

## 📖 API Documentation

The frontend integrates with all 22 backend API endpoints:

- **Health**: System status and info
- **Authentication**: Login/logout
- **Users**: CRUD operations with role management
- **Shops**: Shop management
- **Products**: Product catalog
- **Transactions**: Complete transaction lifecycle
- **Payments**: Payment processing
- **Credits**: Credit management

## 🤝 Contributing

1. Follow the feature-based architecture
2. Use TypeScript strict mode
3. Add proper error handling
4. Include loading and empty states
5. Follow the existing code style
6. Add tests for new features

## 📄 License

Proprietary - Kisaan Center Market Management System