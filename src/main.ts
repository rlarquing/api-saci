import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { ValidationError } from 'class-validator';
import { TypeORMExceptionFilter } from './shared/filter/typeorm-exception.filter';
import {
  EndPointService,
  MenuService,
  RolService,
  UserService,
} from './core/service';
import { parseController } from '../lib';
import { NomencladorTypeEnum } from './shared/enum';

import { AppConfig } from './app.keys';

// Un blip de MongoDB (cierre/reconexión del pool) no debe tumbar el proceso:
// las promesas rechazadas se loguean y se descartan.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(AppModule.loggerProvider);
  // Habilitar trust proxy para obtener la IP real del cliente detrás de proxies (Nginx, Caddy, Cloudflare)
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  // ────────────────────────────────────────────────────────────────
  // CORS: en producción se usa una whitelist estricta leída de
  // CORS_ORIGINS (separada por comas). En desarrollo se permite
  // cualquier origen para facilitar el trabajo local.
  // ────────────────────────────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production';
  const rawOrigins = process.env[AppConfig.CORS_ORIGINS] || '';
  const whitelist = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProduction
      ? (origin, callback) => {
          // Permitir requests sin Origin (server-to-server, health checks)
          if (!origin || whitelist.length === 0 || whitelist.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origen no permitido — ${origin}`));
          }
        }
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  });
  app.useGlobalFilters(new TypeORMExceptionFilter());
  app.setGlobalPrefix('api');

  const isDevelopmentEnv = process.env.NODE_ENV !== 'production';
  if (isDevelopmentEnv) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .addBearerAuth()
        .setTitle('API-SACP')
        .setDescription('Api Para trabajar con el proyecto SACP.')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document, {
      explorer: true,
      swaggerOptions: {
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(validationErrors);
      },
    }),
  );
  await app.listen(AppModule.port);
  const socketEnabled = process.env.SOCKET_ENABLED === 'true';
  console.log(
    `[Socket] ${socketEnabled ? 'ACTIVO' : 'INACTIVO'} (SOCKET_ENABLED=${process.env.SOCKET_ENABLED || 'false'})`,
  );
  if (isDevelopmentEnv) {
    const endPointService = app.get(EndPointService);
    const rolService: RolService = app.get(RolService);
    const userService: UserService = app.get(UserService);
    const menuService = app.get(MenuService);
    const nomencladores: string[] = [];
    for (const [, propertyValue] of Object.entries(NomencladorTypeEnum)) {
      nomencladores.push(propertyValue);
    }
    await rolService.crearRoles();
    // IMPORTANTE: parseController debe ejecutarse PRIMERO para crear los endpoints
    // antes de crear los menús que dependen de ellos
    await parseController(endPointService);
    if (nomencladores.length > 0) {
      await menuService.crearMenuNomenclador(nomencladores);
    }
    await menuService.crearMenuAdministracion();
    await menuService.crearMenuInventario();
    await rolService.asignarFuncionesAdmin();
    await userService.crearUsuarioAdmin();
  }
}
bootstrap();
