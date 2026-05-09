// src/db/index.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import 'dotenv/config';

// A asserção não-nula informa ao TypeScript que a variável de ambiente será definida.
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });