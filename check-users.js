import Database from 'better-sqlite3';

const db = new Database('temp.db');

try {
  // Verificar se a tabela users existe
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  console.log('Tabelas encontradas:', tables);
  
  if (tables.length > 0) {
    // Listar todos os usuários
    const users = db.prepare('SELECT * FROM users').all();
    console.log('Usuários no banco:', users);
    
    // Contar usuários
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('Total de usuários:', count);
  } else {
    console.log('Tabela users não existe');
  }
} catch (error) {
  console.error('Erro ao consultar banco:', error);
} finally {
  db.close();
}