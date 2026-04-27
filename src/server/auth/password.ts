import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keyLength: number,
) => Promise<Buffer>;

const PASSWORD_HASH_SCHEME = "scrypt";
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

export async function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const hash = await scrypt(password, salt, PASSWORD_HASH_KEY_LENGTH);

  return `${PASSWORD_HASH_SCHEME}:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, hash] = passwordHash.split(":");

  if (scheme !== PASSWORD_HASH_SCHEME || !salt || !hash) {
    return false;
  }

  const expectedHash = Buffer.from(hash, "hex");

  if (expectedHash.length !== PASSWORD_HASH_KEY_LENGTH) {
    return false;
  }

  const actualHash = await scrypt(password, salt, expectedHash.length);

  return timingSafeEqual(actualHash, expectedHash);
}
