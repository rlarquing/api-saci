import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule],
  providers: [],
  exports: [ScheduleModule, HttpModule],
})
export class SharedModule {}
