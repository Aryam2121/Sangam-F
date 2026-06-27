import { loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const env = loadEnv(process.env.NODE_ENV || 'development', root, 'VITE_');

const fallbackPath = path.resolve(root, 'public/firebase-config.json');
const fallback = fs.existsSync(fallbackPath)
  ? JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
  : {};

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || fallback.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || fallback.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || fallback.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || fallback.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallback.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || fallback.appId || '',
};

const output = `self.FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(path.resolve(root, 'public/firebase-config.js'), output);
