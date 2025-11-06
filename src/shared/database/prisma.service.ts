import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: "postgresql://gcdbuser:13784652r@localhost:5432/newgamecube?schema=public"
        }
      }
    });
  }

  async onModuleInit() {
    this.logger.log('🔗 Connecting to database...');
    this.logger.log('DATABASE_URL: Hardcoded to newgamecube');
    
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Test connection with a simple query
      const result = await this.$queryRaw`SELECT 1 as test`;
      this.logger.log('✅ Database query test successful');
      
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }
}
