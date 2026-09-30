import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

// Determinar el tipo de base de datos
const dbType = process.env.TYPE || 'mongodb';
const isMongo = dbType === 'mongodb';

// Leer variables de entorno para sincronización y migraciones
const dbSync = process.env.DB_SYNC;
const dbMigrationsRun = process.env.DB_MIGRATIONS_RUN;

const options: DataSourceOptions = {
  type: dbType as any,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '27017'),
  database: process.env.DB_NAME || 'api_base',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  authSource: isMongo ? 'admin' : undefined,
  entities: ['src/persistence/entity/**/*.entity.ts'],
  migrations: isMongo ? [] : ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  logging: process.env.NODE_ENV === 'development',
  // DB_SYNC: true/false (default: false)
  synchronize: dbSync === 'true',
  // Para MongoDB, las migraciones no están soportadas, se fuerza a false
  // Para SQL: DB_MIGRATIONS_RUN: true/false (default: true)
  migrationsRun: isMongo ? false : (dbMigrationsRun === undefined ? true : dbMigrationsRun === 'true'),
};

export const AppDataSource = new DataSource(options);
