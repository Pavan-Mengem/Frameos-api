import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export const hash = (plain: string): Promise<string> => bcrypt.hash(plain, ROUNDS);
export const compare = (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);
