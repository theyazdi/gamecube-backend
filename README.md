# GameCube Backend

A modular NestJS backend application with PostgreSQL database using Prisma ORM and comprehensive Swagger documentation.

## 🏗️ Project Structure

```
src/
├── modules/                    # Feature modules (Domain-driven)
│   ├── auth/                  # Authentication module
│   │   ├── dto/               # Data Transfer Objects
│   │   │   └── auth.dto.ts
│   │   ├── auth.controller.ts # Auth endpoints
│   │   ├── auth.service.ts    # Auth business logic
│   │   ├── auth.module.ts    # Auth module definition
│   │   └── index.ts          # Module exports
│   ├── users/                 # User management module
│   │   ├── dto/               # Data Transfer Objects
│   │   │   └── user.dto.ts
│   │   ├── user.controller.ts # User endpoints
│   │   ├── user.service.ts    # User business logic
│   │   ├── users.module.ts   # User module definition
│   │   └── index.ts          # Module exports
│   └── [future-modules]/      # Additional feature modules
├── shared/                    # Shared utilities and services
│   ├── database/             # Database layer
│   │   ├── prisma.service.ts # Prisma client service
│   │   ├── prisma.module.ts  # Database module
│   │   └── index.ts          # Database exports
│   ├── config/               # Configuration files
│   │   ├── swagger.config.ts # Swagger configuration
│   │   └── index.ts          # Config exports
│   ├── guards/               # Authentication guards
│   ├── decorators/           # Custom decorators
│   ├── utils/                # Utility functions
│   └── index.ts              # Shared exports
├── generated/                # Prisma generated client
├── app.module.ts             # Root module
├── app.controller.ts         # Root controller
├── app.service.ts            # Root service
└── main.ts                   # Application entry point
```

### 🎯 Architecture Principles

- **Domain-Driven Design**: Each module represents a business domain
- **Separation of Concerns**: Clear separation between layers
- **Scalability**: Easy to add new modules and features
- **Maintainability**: Each module is self-contained
- **Reusability**: Shared components in `/shared` directory

## 🚀 Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your database connection in `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gamecube_db?schema=public"
PORT=3000
NODE_ENV=development
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Start the application:
```bash
npm run start:dev
```

## 📦 Available Scripts

- `npm run start:dev` - Start development server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:reset` - Reset database
- `npm run prisma:deploy` - Deploy migrations to production

## 📚 API Documentation

### Swagger UI
Once the application is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3000/api`

The Swagger documentation provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response examples
- Schema definitions
- Authentication support

## 🏛️ Modules

### Users Module (`/users`)
User management endpoints:
- `POST /users` - Create a new user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/uuid/:uuid` - Get user by UUID
- `GET /users/phone/:phone` - Get user by phone number
- `PUT /users/:id` - Update user by ID
- `PUT /users/uuid/:uuid` - Update user by UUID
- `PUT /users/:id/verify-phone` - Verify user's phone
- `PUT /users/:id/verify-email` - Verify user's email
- `PUT /users/:id/verify` - Verify user account
- `DELETE /users/:id` - Delete user by ID
- `DELETE /users/uuid/:uuid` - Delete user by UUID

### Auth Module (`/auth`)
Authentication endpoints:
- `POST /auth/login` - User login with phone and password

### Example Requests

#### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "password": "securePassword123",
    "role": "user"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "password": "securePassword123"
  }'
```

#### Get User by ID
```bash
curl -X GET http://localhost:3000/users/1
```

#### Update User
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isPhoneVerified": true,
    "isVerified": true
  }'
```

## Database Schema

The application includes only a **User** model with the following fields:
- `id` - Primary key (auto-increment)
- `uuid` - Unique UUID identifier (auto-generated)
- `phone` - Unique phone number
- `role` - User role (default: "user")
- `password` - User password (should be hashed)
- `isPhoneVerified` - Phone verification status (default: false)
- `isEmailVerified` - Email verification status (default: false)
- `isVerified` - General verification status (default: false)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Database Features
- **Clean Schema**: Only essential tables for user management
- **Scalable Design**: Easy to add new fields when needed
- **Type Safety**: Full TypeScript support with Prisma
- **Migration Support**: Version-controlled database changes

## Development

This project uses:
- **NestJS** - Progressive Node.js framework
- **Prisma** - Modern database toolkit
- **PostgreSQL** - Relational database
- **TypeScript** - Type-safe JavaScript

## Getting Started

1. Make sure you have PostgreSQL running locally
2. Update the `DATABASE_URL` in `.env` with your database credentials
3. Run migrations to create the database schema
4. Start the development server

## License

MIT