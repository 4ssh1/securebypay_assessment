import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.options';

export default new DataSource(
  buildDataSourceOptions({
    url: process.env.DATABASE_URL as string,
    ssl: process.env.DATABASE_SSL === 'true',
  }),
);
