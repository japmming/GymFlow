import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('genera un hash con formato scrypt y sal aleatoria', async () => {
    const first = await hashPassword('Secreta123!');
    const second = await hashPassword('Secreta123!');

    expect(first).toMatch(
      /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/,
    );
    expect(first).not.toBe(second);
    expect(first).not.toContain('Secreta123!');
  });

  it('acepta la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hashPassword('Secreta123!');

    await expect(verifyPassword('Secreta123!', hash)).resolves.toBe(true);
    await expect(verifyPassword('secreta123!', hash)).resolves.toBe(false);
    await expect(verifyPassword('OtraClave123!', hash)).resolves.toBe(false);
  });

  it('rechaza hashes con formato inválido o parámetros fuera de rango', async () => {
    await expect(verifyPassword('x', 'texto')).resolves.toBe(false);
    await expect(verifyPassword('x', 'bcrypt$10$abc$def')).resolves.toBe(false);
    await expect(
      verifyPassword('x', 'scrypt$1000$8$1$c2FsdA$aGFzaA'),
    ).resolves.toBe(false);
    await expect(
      verifyPassword('x', 'scrypt$16384$99$1$c2FsdA$aGFzaA'),
    ).resolves.toBe(false);
    await expect(verifyPassword('x', 'scrypt$16384$8$1$$')).resolves.toBe(
      false,
    );
  });
});
