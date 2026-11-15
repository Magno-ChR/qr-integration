import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import { getEnv } from "@/shared/config/env";

import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let database: Database | undefined;

export function getDb(): Database {
  if (!database) {
    const sql = neon(databaseUrl(getEnv().DATABASE_URL));
    database = drizzle(sql, { schema });
  }

  return database;
}

function databaseUrl(value: string) {
  const url = new URL(value);
  // channel_binding is a libpq option. The Neon HTTP driver does not use it.
  url.searchParams.delete("channel_binding");
  return url.toString();
}
