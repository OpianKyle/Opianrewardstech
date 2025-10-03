import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: process.env.XNEELO_DB_HOST ? {
    host: process.env.XNEELO_DB_HOST,
    port: parseInt(process.env.XNEELO_DB_PORT || "3306"),
    user: process.env.XNEELO_DB_USER!,
    password: process.env.XNEELO_DB_PASSWORD!,
    database: process.env.XNEELO_DB_NAME!,
  } : {
    url: process.env.DATABASE_URL!,
  },
});
