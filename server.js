
/**
 * Arquivo de entrada para Hostinger
 * Este arquivo carrega as variáveis de ambiente e inicia o servidor
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante que o dotenv procure o arquivo na raiz
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Também tenta carregar as variáveis do sistema (painel Hostinger)
dotenv.config();

console.log('--- DIAGNÓSTICO DE AMBIENTE ---');
console.log('SIGILOPAY_PUBLIC_KEY:', process.env.SIGILOPAY_PUBLIC_KEY ? 'OK' : 'FALTANDO');
console.log('SIGILOPAY_SECRET_KEY:', process.env.SIGILOPAY_SECRET_KEY ? 'OK' : 'FALTANDO');
console.log('-------------------------------');

import './dist-server/server.js';
