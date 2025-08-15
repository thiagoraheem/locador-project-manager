import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('temp.db');

async function createAdminUser() {
  try {
    // Hash da senha 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Inserir usuário administrador
    const stmt = db.prepare(`
      INSERT INTO users (id, username, name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    
    const result = stmt.run(
      'user-1',
      'admin',
      'Administrador',
      'admin@example.com',
      hashedPassword,
      'admin',
      now,
      now
    );
    
    console.log('Usuário administrador criado:', result);
    
    // Verificar se foi inserido
    const users = db.prepare('SELECT id, username, name, email, role FROM users').all();
    console.log('Usuários no banco:', users);
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    db.close();
  }
}

createAdminUser();