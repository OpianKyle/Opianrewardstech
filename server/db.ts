import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

const isXneeloDatabaseAvailable = 
  process.env.XNEELO_DB_HOST && 
  process.env.XNEELO_DB_PORT && 
  process.env.XNEELO_DB_NAME && 
  process.env.XNEELO_DB_USER && 
  process.env.XNEELO_DB_PASSWORD;

const isDatabaseAvailable = isXneeloDatabaseAvailable;

let pool: mysql.Pool | null = null;
let db: any = null;

if (isDatabaseAvailable && isXneeloDatabaseAvailable) {
  const connectionConfig = {
    host: process.env.XNEELO_DB_HOST!,
    port: parseInt(process.env.XNEELO_DB_PORT!),
    user: process.env.XNEELO_DB_USER!,
    password: process.env.XNEELO_DB_PASSWORD!,
    database: process.env.XNEELO_DB_NAME!,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    waitForConnections: true,
  };

  pool = mysql.createPool(connectionConfig);
  db = drizzle(pool, { schema, mode: 'default' });
}

export { pool, db };

export async function initializeDatabase() {
  if (!isDatabaseAvailable) {
    console.log('⚠️ Database environment variables not configured');
    console.log('🔄 Using in-memory storage for development');
    return;
  }

  if (!pool) {
    console.log('❌ Database pool not initialized');
    return;
  }

  try {
    console.log('🔌 Testing database connection...');
    const connection = await pool.getConnection();
    await connection.ping();
    
    console.log('📋 Creating database tables...');
    await createTablesIfNotExist(connection);
    
    connection.release();
    console.log('✅ Database connection successful');
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('🔄 Falling back to in-memory storage');
  }
}

export function isDatabaseConnected(): boolean {
  return Boolean(isDatabaseAvailable) && pool !== null && db !== null;
}

async function createTablesIfNotExist(connection: mysql.PoolConnection) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(15),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS investors (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      tier VARCHAR(50) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      amount INT NOT NULL,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      adumo_payment_id VARCHAR(255),
      adumo_customer_id VARCHAR(255),
      subscription_id VARCHAR(255),
      quest_progress JSON,
      certificate_generated TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      investor_id VARCHAR(36) NOT NULL,
      amount INT NOT NULL,
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS transactions (
      transaction_id VARCHAR(36) PRIMARY KEY,
      merchant_reference VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL,
      amount INT NOT NULL,
      currency_code CHAR(3) NOT NULL DEFAULT 'ZAR',
      payment_method VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      puid VARCHAR(36),
      tkn VARCHAR(255),
      token TEXT,
      error_code INT,
      error_message VARCHAR(255),
      error_detail TEXT,
      payment_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS payment_methods (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      card_type VARCHAR(50),
      last_four_digits CHAR(4),
      expiry_month INT,
      expiry_year INT,
      puid VARCHAR(36),
      is_active INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS otps (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(191) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];

  for (const tableSQL of tables) {
    await connection.execute(tableSQL);
  }
  
  console.log('✅ Database tables created/verified');
}
