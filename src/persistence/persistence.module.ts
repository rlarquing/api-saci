import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entity, repository } from './persistence.service';
@Module({
  imports: [TypeOrmModule.forFeature([...entity]), SharedModule],
  providers: [...repository],
  exports: [...repository],
})
export class PersistenceModule {}
