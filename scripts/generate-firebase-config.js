import { loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'VITE_');

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const output = `self.FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(path.resolve('public/firebase-config.js'), output);
