import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { swaggerConfig } from './shared/config';
import 'dotenv/config';

async function bootstrap() {
  // Hardcode environment variables for testing
  process.env.DATABASE_URL = "postgresql://gcdbuser:13784652r@localhost:5432/newgamecube?schema=public";
  process.env.JWT_SECRET = "your-super-secret-jwt-key-here";
  process.env.FARAZSMS_TOKEN = "YTAzMjZjNTAtNDM5MC00YjM5LTg0MGEtZGNjODAxZjU1YjlkZTI4NjAxNTE4MjViMmFhOTgxYTYxN2FjY2U1N2JiODU=";
  
  // Log environment variables
  console.log('🔍 Environment Variables Check:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
  console.log('FARAZSMS_TOKEN:', process.env.FARAZSMS_TOKEN ? 'Found' : 'NOT FOUND');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'NOT FOUND');
  
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'origin', 'x-requested-with'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('/', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      withCredentials: true,
    },
    customSiteTitle: 'GameCube API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
    `,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/`);
}
bootstrap();
