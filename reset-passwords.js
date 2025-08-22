
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Configuração do banco (mesma do db.ts)
const sqlServerConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
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

async function resetPasswords() {
  let pool;
  try {
    console.log('Conectando ao banco de dados...');
    pool = new sql.ConnectionPool(sqlServerConfig);
    await pool.connect();
    console.log('Conectado com sucesso!');

    // Senha padrão para todos os usuários
    const defaultPassword = 'Password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Lista dos usuários para resetar
    const users = [
      { id: 'user-0ehhr0rq3', username: 'admin' },
      { id: 'user-1', username: 'admin_alt' },
      { id: 'user-h3a2kfecx', username: 'user' }
    ];

    console.log('\nResetando senhas dos usuários...');
    
    for (const user of users) {
      const request = pool.request();
      await request
        .input('id', sql.NVarChar, user.id)
        .input('password', sql.NVarChar, hashedPassword)
        .query('UPDATE users SET password = @password WHERE id = @id');
      
      console.log(`✓ Senha resetada para usuário: ${user.username} (${user.id})`);
    }

    console.log('\n=== CREDENCIAIS DE ACESSO ===');
    console.log('Todos os usuários agora têm a senha: Password123');
    console.log('\nUsuários disponíveis:');
    
    // Buscar informações atualizadas dos usuários
    const request = pool.request();
    const result = await request.query('SELECT id, username, email, role FROM users WHERE id IN (\'user-0ehhr0rq3\', \'user-1\', \'user-h3a2kfecx\')');
    
    result.recordset.forEach(user => {
      console.log(`- Email: ${user.email} | Username: ${user.username} | Role: ${user.role}`);
    });
    
    console.log('\nUse qualquer um desses emails com a senha: Password123');
    console.log('===============================\n');

  } catch (error) {
    console.error('Erro ao resetar senhas:', error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('Conexão fechada.');
    }
  }
}

// Executar o script
resetPasswords();
