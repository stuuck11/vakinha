
/**
 * Arquivo de entrada para Hostinger
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');

const child = spawn(tsxPath, [path.join(__dirname, 'server.ts')], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('exit', (code) => {
  process.exit(code);
});
