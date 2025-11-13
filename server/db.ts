import dotenv from 'dotenv';
// Load environment variables before anything else
dotenv.config();

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// Validate required MySQL environment variables
if (!process.env.MYSQL_HOST) {
  throw new Error("MYSQL_HOST environment variable is required. Please add it to Replit Secrets.");
}
if (!process.env.MYSQL_USER) {
  throw new Error("MYSQL_USER environment variable is required. Please add it to Replit Secrets.");
}
if (!process.env.MYSQL_PASSWORD) {
  throw new Error("MYSQL_PASSWORD environment variable is required. Please add it to Replit Secrets.");
}
if (!process.env.MYSQL_DATABASE) {
  throw new Error("MYSQL_DATABASE environment variable is required. Please add it to Replit Secrets.");
}

// Azure MySQL configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// Create MySQL connection pool for Azure MySQL
const poolConnection = mysql.createPool({
  ...MYSQL_CONFIG,
  ssl: {
    // Azure MySQL requires SSL
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance with MySQL connection
export const db = drizzle(poolConnection, { schema, mode: "default" });

// Test connection on startup
poolConnection.getConnection()
  .then((connection) => {
    console.log("✓ Successfully connected to Azure MySQL database");
    console.log(`   Host: ${MYSQL_CONFIG.host}`);
    console.log(`   Database: ${MYSQL_CONFIG.database}`);
    connection.release();
  })
  .catch((error) => {
    console.error("✗ Failed to connect to Azure MySQL database:", error);
    console.error(`   Host: ${MYSQL_CONFIG.host}`);
    console.error(`   Database: ${MYSQL_CONFIG.database}`);
  });
