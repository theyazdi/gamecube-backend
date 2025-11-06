import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('GameCube Backend API')
  .setDescription(`
    # GameCube Backend API Documentation
    
    A comprehensive REST API for GameCube backend built with:
    - **NestJS** - Progressive Node.js framework
    - **PostgreSQL** - Relational database
    - **Prisma** - Modern database toolkit
    - **Swagger** - API documentation
    
    ## Features
    - User management with phone-based authentication
    - Phone and email verification system
    - Role-based access control
    - Comprehensive validation
    - Interactive API testing
    - Modular architecture
    
    ## Modules
    - **Users** - User management endpoints
    - **Auth** - Authentication and authorization
    - **Prisma** - Database connection management
    
    ## Getting Started
    1. Start the server: \`npm run start:dev\`
    2. Access Swagger UI: \`http://localhost:3000/api\`
    3. Test endpoints directly from the documentation
    
    ## Authentication
    This API supports Bearer token authentication for protected endpoints.
  `)
  .setVersion('1.0.0')
  .setContact(
    'GameCube Team',
    'https://gamecube.com',
    'support@gamecube.com'
  )
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addTag('users', 'User management endpoints - Create, read, update, delete users')
  .addTag('User Panel', 'User panel endpoints - Get profile and complete profile information')
  .addTag('auth', 'Authentication endpoints - Login and user authentication')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth'
  )
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.gamecube.com', 'Production server')
  .build();
