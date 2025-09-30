import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: process.env.DATABASE_URL ? {
    url: process.env.DATABASE_URL,
  } : {
    host: process.env.XNEELO_DB_HOST || "localhost",
    port: parseInt(process.env.XNEELO_DB_PORT || "3306"),
    user: process.env.XNEELO_DB_USER || "root",
    password: process.env.XNEELO_DB_PASSWORD || "",
    database: process.env.XNEELO_DB_NAME || "opian_rewards",
  },
});
