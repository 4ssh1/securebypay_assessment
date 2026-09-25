import { DataSourceOptions } from 'typeorm';
import { ENTITIES } from '../entities';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export interface DatabaseSettings {
  url: string;
  ssl: boolean;
}

export const buildDataSourceOptions = ({ url, ssl }: DatabaseSettings): DataSourceOptions => ({
  type: 'postgres',
  url,
  ssl: ssl ? { rejectUnauthorized: true } : false,
  entities: ENTITIES,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  namingStrategy: new SnakeNamingStrategy(),
  uuidExtension: 'pgcrypto',
  installExtensions: false,
  synchronize: false,
  migrationsRun: false,
});
