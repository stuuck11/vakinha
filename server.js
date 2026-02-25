
/**
 * Arquivo de entrada para Hostinger
 * Registra o suporte a TypeScript e inicia o servidor
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Registra o carregador do tsx
register('tsx', pathToFileURL('./'));

// Importa o servidor principal
import('./server.ts');
