import 'dotenv/config'; // Carga .env ANTES de que NestJS/ConfigModule arranque.
import { DatabaseModule } from './database/database.module';
import { PersistenceModule } from './persistence/persistence.module';
import { CoreModule } from './core/core.module';
import { ApiModule } from './api/api.module';
import { MailModule } from './mail/mail.module';

// dotenv/config ya popula process.env con todas las variables del .env.
// Esto asegura que process.env.SOCKET_ENABLED y otras variables estén
// disponibles antes de que NestJS evaluate los módulos.

export const module = [
  DatabaseModule,
  PersistenceModule,
  CoreModule,
  ApiModule,
  MailModule,
  ...(process.env.SOCKET_ENABLED === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga condicional: un import estático montaría el gateway aunque SOCKET_ENABLED sea false
      [require('./socket/socket.module').SocketModule]
    : []),
];
