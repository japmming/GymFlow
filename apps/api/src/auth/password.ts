import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_PREFIX = 'scrypt';

const SCRYPT_OPTIONS: ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
};

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

/**
 * Genera un hash con sal aleatoria en el formato
 * scrypt$N$r$p$sal$hash (sal y hash en base64url).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS,
  );

  return [
    HASH_PREFIX,
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

/**
 * Compara una contraseña con un hash almacenado usando
 * una comparación de tiempo constante.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$');

  if (parts.length !== 6 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const [, rawN, rawR, rawP, rawSalt, rawDerivedKey] = parts;

  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N <= 1 ||
    N > 1048576 ||
    (N & (N - 1)) !== 0 ||
    r <= 0 ||
    r > 32 ||
    p <= 0 ||
    p > 16
  ) {
    return false;
  }

  const salt = Buffer.from(rawSalt, 'base64url');
  const expected = Buffer.from(rawDerivedKey, 'base64url');

  if (salt.length === 0 || expected.length === 0) {
    return false;
  }

  try {
    const derivedKey = await deriveKey(password, salt, expected.length, {
      N,
      r,
      p,
    });

    return timingSafeEqual(derivedKey, expected);
  } catch {
    return false;
  }
}
