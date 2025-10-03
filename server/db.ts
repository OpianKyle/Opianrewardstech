import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql as drizzleSql } from 'drizzle-orm';
import * as schema from "@shared/schema";

const isDatabaseAvailable = Boolean(process.env.DATABASE_URL);

let db: any = null;
let sql: any = null;

if (isDatabaseAvailable) {
  sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql, { schema });
}

export { db };

export async function initializeDatabase() {
  if (!isDatabaseAvailable) {
    console.log('⚠️ Database environment variables not configured');
    console.log('🔄 Using in-memory storage for development');
    return;
  }

  if (!db) {
    console.log('❌ Database not initialized');
    return;
  }

  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection by running a simple query
    await db.execute(drizzleSql`SELECT 1`);
    
    console.log('✅ Database connection successful');
    console.log('✅ Database initialized');
    console.log('💡 Run "npm run db:push" to create/update database tables');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('🔄 Falling back to in-memory storage');
  }
}

export function isDatabaseConnected(): boolean {
  return Boolean(isDatabaseAvailable) && db !== null;
}
