import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.keys';
import {
  EndPointEntity,
  FuncionEntity,
  LogHistoryEntity,
  MenuEntity,
  MovimientoInventarioEntity,
  ProductoEntity,
  UnidadEntity,
  UbicacionEntity,
  AlmacenEntity,
  QrEntity,
  RegistroDiarioEntity,
  RolEntity,
  CategoriaEntity,
  UserEntity,
  ConteoInventarioEntity,
} from '../persistence/entity';

export const databaseProviders = [
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    async useFactory(configService: ConfigService) {
      const dbConfig = configService.get(AppConfig.DATABASE);
      const isMongo = dbConfig.type === 'mongodb';

      return {
        ...dbConfig,
        entities: [
          EndPointEntity,
          FuncionEntity,
          LogHistoryEntity,
          MenuEntity,
          MovimientoInventarioEntity,
  ProductoEntity,
  UnidadEntity,
  UbicacionEntity,
          AlmacenEntity,
                  QrEntity,
          RegistroDiarioEntity,
          RolEntity,
          CategoriaEntity,
          UserEntity,
          ConteoInventarioEntity,
        ],
        migrations: isMongo ? [] : [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: isMongo ? false : dbConfig.migrationsRun,
      };
    },
  }),
];
