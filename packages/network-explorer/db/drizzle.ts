import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const sql = new Client({
  connectionString: "postgres://user:password@host:port/db",
});

const db = drizzle(sql);
export default db;
