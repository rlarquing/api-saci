import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.keys';
import { providers } from './core.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get(AppConfig.SECRET),
          signOptions: {
            expiresIn: 3600,
          },
        };
      },
    }),
    PersistenceModule,
    SharedModule,
    MailModule,
  ],
  providers: [...providers],
  exports: [PassportModule, JwtModule, ...providers],
})
export class CoreModule {}
