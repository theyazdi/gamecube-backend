# Development Guide

## 🏗️ Adding New Modules

To add a new module to the project, follow these steps:

### 1. Create Module Structure
```bash
mkdir -p src/modules/your-module/dto
```

### 2. Create Module Files
- `your-module.controller.ts` - Controller for API endpoints
- `your-module.service.ts` - Business logic service
- `your-module.module.ts` - Module definition
- `dto/your-module.dto.ts` - Data Transfer Objects
- `index.ts` - Export file

### 3. Example Module Structure
```typescript
// src/modules/your-module/your-module.module.ts
import { Module } from '@nestjs/common';
import { YourModuleController } from './your-module.controller';
import { YourModuleService } from './your-module.service';

@Module({
  controllers: [YourModuleController],
  providers: [YourModuleService],
  exports: [YourModuleService],
})
export class YourModuleModule {}
```

### 4. Add to AppModule
```typescript
// src/app.module.ts
import { YourModuleModule } from './modules/your-module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, YourModuleModule],
  // ...
})
export class AppModule {}
```

### 5. Update Swagger Config
```typescript
// src/config/swagger.config.ts
.addTag('your-module', 'Your module description')
```

## 📁 Module Best Practices

### File Organization
- Keep related files together in the same module directory
- Use DTOs for request/response validation
- Export everything through `index.ts` files
- Use descriptive file and class names

### Service Pattern
- Services should contain business logic
- Use dependency injection for other services
- Keep services focused on a single responsibility

### Controller Pattern
- Controllers should only handle HTTP requests/responses
- Use Swagger decorators for documentation
- Validate input using DTOs and class-validator

### DTO Pattern
- Create separate DTOs for requests and responses
- Use validation decorators from class-validator
- Use Swagger decorators for API documentation

## 🔧 Common Commands

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Run Database Migrations
```bash
npm run prisma:migrate
```

### Start Development Server
```bash
npm run start:dev
```

### Build Project
```bash
npm run build
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📚 Documentation

- API documentation is automatically generated via Swagger
- Access Swagger UI at `http://localhost:3000/api`
- Update Swagger config in `src/config/swagger.config.ts`

## 🗄️ Database

- Use Prisma for database operations
- PrismaService is globally available in all modules
- Run migrations after schema changes
- Use Prisma Studio for database management: `npm run prisma:studio`
