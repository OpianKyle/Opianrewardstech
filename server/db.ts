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
  // First, run migrations to add missing columns to existing tables
  try {
    // Check if payment_methods table exists
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods'`
    ) as any;

    if (tables.length > 0) {
      // Table exists, check for missing columns
      const columnsToAdd = ['token_uid', 'profile_uid'];
      
      for (const columnName of columnsToAdd) {
        const [columns] = await connection.execute(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = ?`,
          [columnName]
        ) as any;

        if (columns.length === 0) {
          // Column doesn't exist, add it
          const alterSQL = columnName === 'token_uid' 
            ? `ALTER TABLE payment_methods ADD COLUMN token_uid VARCHAR(255)`
            : `ALTER TABLE payment_methods ADD COLUMN profile_uid VARCHAR(255)`;
          
          await connection.execute(alterSQL);
          console.log(`✅ Added column ${columnName} to payment_methods table`);
        }
      }
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    throw error; // Fail fast on migration errors
  }

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(191) NOT NULL UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(15),
      tier VARCHAR(50),
      payment_method VARCHAR(50),
      amount INT,
      payment_status VARCHAR(50) DEFAULT 'pending',
      adumo_payment_id VARCHAR(255),
      adumo_customer_id VARCHAR(255),
      subscription_id VARCHAR(255),
      quest_progress JSON,
      certificate_generated TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      amount INT NOT NULL,
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      invoice_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      merchant_reference VARCHAR(255) NOT NULL UNIQUE,
      adumo_transaction_id VARCHAR(255) UNIQUE,
      adumo_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
      payment_method VARCHAR(50),
      gateway ENUM('ADUMO', 'STRIPE', 'OTHER') NOT NULL DEFAULT 'ADUMO',
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
      request_payload TEXT,
      response_payload TEXT,
      notify_url_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS payment_methods (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      card_type VARCHAR(50),
      last_four_digits CHAR(4),
      expiry_month INT,
      expiry_year INT,
      token_uid VARCHAR(255),
      profile_uid VARCHAR(255),
      puid VARCHAR(36),
      is_active INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS otps (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(191) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      deposit_payment_id VARCHAR(36),
      adumo_subscriber_id VARCHAR(255),
      adumo_schedule_id VARCHAR(255),
      tier VARCHAR(50) NOT NULL,
      monthly_amount DECIMAL(10, 2) NOT NULL,
      total_months INT NOT NULL DEFAULT 12,
      paid_months INT NOT NULL DEFAULT 0,
      status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
      next_payment_date TIMESTAMP NULL,
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      subscription_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (deposit_payment_id) REFERENCES payments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    `CREATE TABLE IF NOT EXISTS access_requests (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      company VARCHAR(255),
      street_address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      province VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) NOT NULL,
      fica_documents JSON,
      accepted_terms INT NOT NULL DEFAULT 0,
      accepted_privacy INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];

  for (const tableSQL of tables) {
    await connection.execute(tableSQL);
  }
  
  console.log('✅ Database tables created/verified');
}
