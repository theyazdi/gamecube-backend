import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      useFactory: async () => {
        // اگر Redis در دسترس نباشد، از memory cache استفاده کن
        const useRedis = process.env.REDIS_ENABLED === 'true';

        if (useRedis) {
          try {
            const store = await redisStore({
              socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
              },
              password: process.env.REDIS_PASSWORD,
              ttl: 300 * 1000, // 5 minutes default TTL (in milliseconds)
            });

            console.log('✅ Redis Cache enabled');
            return { store };
          } catch (error) {
            console.warn('⚠️ Redis connection failed, falling back to memory cache:', error.message);
            return {
              ttl: 300 * 1000, // 5 minutes
            };
          }
        }

        console.log('ℹ️ Using memory cache (Redis disabled)');
        return {
          ttl: 300 * 1000, // 5 minutes
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
