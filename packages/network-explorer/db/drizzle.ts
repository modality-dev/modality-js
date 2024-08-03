import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const sql = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(sql);
export default db;
