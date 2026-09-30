import { Module } from '@nestjs/common';
import { AppConfig } from './app.keys';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { config } from '../config/config';
import { LoggerProvider } from './core/logger/logger.provider';
import { module } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    // Rate limiting global: 60 requests por 60 segundos por IP (default).
    // Las rutas de auth aplican throttling más estricto con @Throttle().
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000, // 60 segundos
        limit: 60, // 60 peticiones por ventana
      },
    ]),
    ...module,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  static port: number | string;
  static cors: boolean;
  static loggerProvider: LoggerProvider;

  constructor(private configService: ConfigService) {
    AppModule.port = parseInt(this.configService.get(AppConfig.PORT));
    AppModule.cors = this.configService.get(AppConfig.CORS) === 'true';
    AppModule.loggerProvider = new LoggerProvider(configService);
  }
}
