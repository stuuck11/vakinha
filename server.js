
/**
 * Arquivo de entrada para Hostinger
 * Este arquivo garante que o servidor TypeScript seja iniciado corretamente
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicia o server.ts usando o tsx que está na pasta node_modules
const child = spawn('npx', ['tsx', path.join(__dirname, 'server.ts')], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('exit', (code) => {
  console.log(`Servidor finalizado com código: ${code}`);
  process.exit(code);
});
