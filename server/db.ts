import sql from "mssql";

// SQL Server configuration
const sqlServerConfig: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: true, // Configured for development environment
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
};

let sqlServerPool: sql.ConnectionPool | null = null;

// Initialize SQL Server connection
async function initSqlServer() {
  if (
    !process.env.DB_SERVER ||
    !process.env.DB_DATABASE ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD
  ) {
    throw new Error(
      "SQL Server configuration missing. Please set DB_SERVER, DB_DATABASE, DB_USER, and DB_PASSWORD environment variables.",
    );
  }

  try {
    // Buscar IPs do servidor usando função utilitária
    const { getServerIPs } = await import("./ip-utils");
    const ipData = await getServerIPs();
    const ip = ipData?.externalIP ||
      (ipData?.localIPs && ipData.localIPs.length > 0
        ? ipData.localIPs[0].ip
        : "Não disponível");
    console.log(`Replit IP: ${ip}`);
    console.log(`IPs locais encontrados:`, ipData.localIPs);
  } catch (error) {
    console.error("Failed to fetch Replit IP:", error);
  }

  try {
    console.log("Attempting to connect to SQL Server...");
    sqlServerPool = new sql.ConnectionPool(sqlServerConfig);
    await sqlServerPool.connect();
    console.log("Connected to SQL Server successfully!");

    // Initialize storage with the connection pool
    const { setDb } = await import('./storage-sqlserver');
    setDb(sqlServerPool);

    await createSqlServerTables();
  } catch (error) {
    console.error("Failed to connect to SQL Server:", error);
    throw error;
  }
}

// Create SQL Server tables
async function createSqlServerTables() {
  if (!sqlServerPool) return;

  try {
    await sqlServerPool.request().query(`
      -- Create tables if they don't exist
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        username NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'member',
        created_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
      CREATE TABLE projects (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NTEXT,
        status NVARCHAR(50) NOT NULL DEFAULT 'planning',
        start_date DATETIME2 NOT NULL,
        end_date DATETIME2,
        created_by NVARCHAR(50) NOT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tickets')
      CREATE TABLE tickets (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(500) NOT NULL,
        description NTEXT NOT NULL,
        priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
        status NVARCHAR(50) NOT NULL DEFAULT 'open',
        project_id NVARCHAR(50),
        reporter_id NVARCHAR(50) NOT NULL,
        assignee_id NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (assignee_id) REFERENCES users(id)
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'task_types')
      CREATE TABLE task_types (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) UNIQUE NOT NULL,
        description NTEXT,
        color NVARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
      CREATE TABLE tasks (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(500) NOT NULL,
        description NTEXT,
        status NVARCHAR(50) NOT NULL DEFAULT 'todo',
        priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
        task_type_id NVARCHAR(50),
        project_id NVARCHAR(50) NOT NULL,
        assignee_id NVARCHAR(50),
        start_date DATETIME2,
        end_date DATETIME2,
        expected_end_date DATETIME2,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (assignee_id) REFERENCES users(id),
        FOREIGN KEY (task_type_id) REFERENCES task_types(id)
      );

      -- Adicionar coluna task_type_id se ela não existir (para casos onde a tabela já foi criada)
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'task_type_id')
      BEGIN
        ALTER TABLE tasks ADD task_type_id NVARCHAR(50);
        ALTER TABLE tasks ADD CONSTRAINT FK_tasks_task_type_id FOREIGN KEY (task_type_id) REFERENCES task_types(id);
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
      CREATE TABLE notifications (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        type NVARCHAR(100) NOT NULL,
        title NVARCHAR(500) NOT NULL,
        message NTEXT NOT NULL,
        user_id NVARCHAR(50) NOT NULL,
        entity_type NVARCHAR(50),
        entity_id NVARCHAR(50),
        [read] BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'comments')
      CREATE TABLE comments (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        content NTEXT NOT NULL,
        ticket_id NVARCHAR(50) NOT NULL,
        author_id NVARCHAR(50) NOT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'task_dependencies')
      CREATE TABLE task_dependencies (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        task_id NVARCHAR(50) NOT NULL,
        depends_on_task_id NVARCHAR(50) NOT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
      );
    `);

    // Create default admin user for SQL Server
    const adminExists = await sqlServerPool
      .request()
      .query("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
    if (adminExists.recordset[0].count === 0) {
      const userId = "user-" + Math.random().toString(36).substr(2, 9);
      await sqlServerPool
        .request()
        .input("id", userId)
        .input("username", "admin")
        .input("password", "hashed_password_here")
        .input("name", "Administrador")
        .input("email", "admin@projectflow.com")
        .input("role", "admin").query(`
          INSERT INTO users (id, username, password, name, email, role)
          VALUES (@id, @username, @password, @name, @email, @role)
        `);
      console.log("Default admin user created for SQL Server with ID:", userId);
    }

    // Seed default task types if they don't exist
    const checkTaskTypes = await sqlServerPool.request()
      .query('SELECT COUNT(*) as count FROM task_types');

    if (checkTaskTypes.recordset[0].count === 0) {
      await sqlServerPool.request().query(`
          INSERT INTO task_types (id, name, description, color, active)
          VALUES 
            ('tasktype_1', 'Feature', 'Nova funcionalidade', '#10B981', 1),
            ('tasktype_2', 'Bug', 'Correção de erro', '#EF4444', 1),
            ('tasktype_3', 'Task', 'Tarefa geral', '#3B82F6', 1),
            ('tasktype_4', 'Enhancement', 'Melhoria', '#8B5CF6', 1)
        `);
      console.log('Default task types inserted');
    }

    // Insert default user if none exist
    const usersCount = await sqlServerPool.request().query('SELECT COUNT(*) as count FROM users');
    if (usersCount.recordset[0].count === 0) {
      await sqlServerPool.request().query(`
          INSERT INTO users (id, username, password, name, email, role)
          VALUES 
            ('user-1', 'admin', 'password123', 'Usuário Administrador', 'admin@projectflow.com', 'admin'),
            ('user-h3a2kfecx', 'user', 'password123', 'Usuário Teste', 'user@projectflow.com', 'member')
        `);
      console.log('Default users inserted');
    } else {
      // Verificar se user-1 existe especificamente
      const user1Check = await sqlServerPool.request()
        .input('userId', sqlServerPool.constructor.NVarChar, 'user-1')
        .query('SELECT COUNT(*) as count FROM users WHERE id = @userId');
      
      if (user1Check.recordset[0].count === 0) {
        await sqlServerPool.request().query(`
            INSERT INTO users (id, username, password, name, email, role)
            VALUES ('user-1', 'admin', 'password123', 'Usuário Administrador', 'admin@projectflow.com', 'admin')
          `);
        console.log('user-1 inserted');
      }
    }

    console.log("SQL Server tables created successfully");
  } catch (error) {
    console.error("Error creating SQL Server tables:", error);
    throw error;
  }
}

// Database abstraction layer
export { sqlServerPool as db };

// Set database reference for storage
export function getDb(): sql.ConnectionPool {
  if (!sqlServerPool) {
    throw new Error('Database not initialized');
  }
  return sqlServerPool;
}

// Initialize database
export async function initDatabase() {
  await initSqlServer();
}

// Initialize on startup
initDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});