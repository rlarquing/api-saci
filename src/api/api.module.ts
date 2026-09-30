import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { controller } from './api.service';

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [...controller],
  providers: [],
  exports: [],
})
export class ApiModule {}
