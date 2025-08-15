import Database from 'better-sqlite3';

const db = new Database('temp.db');

try {
  // Verificar estrutura da tabela users
  const schema = db.prepare("PRAGMA table_info(users)").all();
  console.log('Estrutura da tabela users:');
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (nullable: ${!col.notnull})`);
  });
  
  // Verificar todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nTabelas no banco:', tables.map(t => t.name));
  
} catch (error) {
  console.error('Erro:', error);
} finally {
  db.close();
}