import * as fs from 'fs';
import { normalize } from 'path';
import { AppConfig } from '../src/app.keys';
import { Configuration } from '../src/database/database.keys';

const defined = (v) => typeof v != 'undefined' && v != '';
export const env = (name: string, default_value?) => {
  const envFilePath = normalize(`${process.cwd()}/.env`);
  const existsPath = fs.existsSync(envFilePath);
  if (!existsPath) {
    console.error('.env file does not exist — cannot start.');
    process.exit(1);
  }
  let v: any = process.env[name];
  if (!defined(default_value) && !defined(v)) {
    console.error(`Missing environment variable: "${name}" — cannot start.`);
    process.exit(1);
  }

  if (v === 'true') {
    v = true;
  }
  if (v === 'false') {
    v = false;
  }

  return v ?? default_value;
};
export const config = () => ({
  port: Number(env(AppConfig.PORT, 3000)),
  cors: env(AppConfig.CORS, true),
  logger: env(AppConfig.LOGGER, true),
  database: {
    ssl: env(AppConfig.SSL, false),
    type: env(AppConfig.TYPE, 'mongodb'),
    host: env(Configuration.DB_HOST, 'localhost'),
    port: Number(env(Configuration.DB_PORT, 27017)),
    username: env(Configuration.DB_USER, 'admin'),
    password: env(Configuration.DB_PASS, 'admin'),
    database: env(Configuration.DB_NAME),
    authSource: env(Configuration.DB_AUTH_SOURCE, 'admin'),
    synchronize: env(Configuration.DB_SYNC, false),
    migrationsRun: env(Configuration.DB_MIGRATIONS_RUN, true),
  },
  loggerLevels: env(AppConfig.LOGGER_LEVELS).split(',') || [],
});

