import * as bcrypt from 'bcrypt';
import { getProcessEnvOrThrow } from './env.util';

export async function hashPassword(value: string): Promise<string> {
  const saltRounds = parseInt(getProcessEnvOrThrow('BCRYPT_SALT_ROUNDS'), 10);
  return bcrypt.hash(value, saltRounds);
}

export async function comparePassword(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
