import io from 'socket.io-client';
import { APP_API_BASE_URL } from '../config/api';

export const createAuthenticatedSocket = () =>
  io(APP_API_BASE_URL, { withCredentials: true });
