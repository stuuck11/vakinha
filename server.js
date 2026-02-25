
/**
 * Arquivo de entrada para Hostinger
 * Inicia o servidor usando o caminho direto do binário tsx
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho direto para o executável do tsx dentro da sua pasta na Hostinger
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

console.log('Iniciando servidor Vakinha...');

const child = spawn(process.execPath, [tsxPath, join(__dirname, 'server.ts')], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000
  }
});

child.on('error', (err) => {
  console.error('Erro crítico ao iniciar o processo:', err);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Servidor parou inesperadamente com código: ${code}`);
  }
});
