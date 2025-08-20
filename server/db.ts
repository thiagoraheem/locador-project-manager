import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please ensure the database is provisioned."
  );
}

const connection = neon(process.env.DATABASE_URL);
export const db = drizzle(connection, { schema });

// Initialize database connection (test connectivity)
export async function initDatabase() {
  try {
    console.log("Testing database connection...");
    
    // Simple connectivity test
    await connection`SELECT 1 as test`;
    console.log("Database connection established successfully!");
    
    // Initialize some sample data if empty
    await initSampleData();
    
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
}

// Initialize on startup
// Sample data initialization
async function initSampleData() {
  try {
    // Check if we have any users
    const existingUsers = await db.select().from(schema.users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('Creating sample data...');
      
      // Create sample user
      const [user] = await db.insert(schema.users).values({
        username: 'admin',
        password: 'admin',
        name: 'Administrator',
        email: 'admin@projectflow.com',
        role: 'admin'
      }).returning();
      
      // Create sample project
      const [project] = await db.insert(schema.projects).values({
        name: 'Sample Project',
        description: 'A sample project for testing',
        status: 'planning',
        startDate: new Date(),
        createdBy: user.id
      }).returning();
      
      // Create sample task
      await db.insert(schema.tasks).values({
        title: 'Sample Task',
        description: 'A sample task for testing',
        status: 'todo',
        priority: 'medium',
        projectId: project.id,
        assigneeId: user.id
      });
      
      console.log('Sample data created successfully');
    }
  } catch (error) {
    console.log('Note: Sample data initialization failed, but continuing:', error.message);
  }
}

initDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});