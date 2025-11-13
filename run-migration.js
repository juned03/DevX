// Simple script to run the phase column migration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function runMigration() {
  console.log('🔄 Connecting to database...');
  
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('✅ Connected to database');
    
    // Check if phase column already exists
    console.log('\n📋 Checking if phase column exists...');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM wiki_pages LIKE 'phase'"
    );
    
    if (columns.length > 0) {
      console.log('✅ Phase column already exists!');
      console.log('Column details:', columns[0]);
    } else {
      console.log('➕ Adding phase column...');
      
      // Add the phase column (TEXT can't have DEFAULT in MySQL, so add nullable first then update)
      await connection.execute(`
        ALTER TABLE wiki_pages 
        ADD COLUMN phase VARCHAR(50) NOT NULL DEFAULT 'reference'
        AFTER page_type
      `);
      
      console.log('✅ Phase column added successfully!');
      
      // Update existing records based on pageType
      console.log('\n🔄 Updating existing records...');
      
      const updates = [
        { phase: 'planning', types: ['overview', 'feasibility-study', 'risk-assessment'] },
        { phase: 'requirements', types: ['business-requirements', 'srs', 'use-cases', 'rtm', 'use-case-diagram', 'dfd'] },
        { phase: 'design', types: ['technical-architecture', 'system-design', 'ui-ux-design', 'database-design', 'class-diagram', 'sequence-diagram', 'component-diagram', 'data-models'] },
        { phase: 'implementation', types: ['features', 'api', 'coding-standards', 'version-control', 'infrastructure-diagram'] },
        { phase: 'testing', types: ['testing', 'test-plan', 'test-cases', 'test-coverage-matrix'] },
        { phase: 'deployment', types: ['deployment', 'release-notes', 'user-manual', 'maintenance-plan'] },
        { phase: 'reference', types: ['glossary', 'security', 'workflows', 'personas'] }
      ];
      
      for (const { phase, types } of updates) {
        const placeholders = types.map(() => '?').join(',');
        const [result] = await connection.execute(
          `UPDATE wiki_pages SET phase = ? WHERE page_type IN (${placeholders})`,
          [phase, ...types]
        );
        console.log(`  - Updated ${result.affectedRows} records to phase '${phase}'`);
      }
    }
    
    // Show current distribution
    console.log('\n📊 Current phase distribution:');
    const [distribution] = await connection.execute(`
      SELECT phase, COUNT(*) as count, GROUP_CONCAT(DISTINCT page_type) as page_types 
      FROM wiki_pages 
      GROUP BY phase
    `);
    console.table(distribution);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration().catch(console.error);
