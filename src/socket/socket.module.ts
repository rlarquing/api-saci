import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SocketGateway } from './gateway/socket.gateway';
import { SocketController } from './controller/socket.controller';

@Module({
  imports: [CoreModule, PersistenceModule],
  controllers: [SocketController],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
