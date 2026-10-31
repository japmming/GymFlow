import { useState, type FormEvent } from 'react';

import { useAuth } from '../../auth/AuthProvider';

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">GF</span>

          <div>
            <h1>GymFlow</h1>
            <p>Gestión simple para tu gimnasio</p>
          </div>
        </div>

        <h2>Inicia sesión</h2>

        <p className="login-subtitle">
          Accede con tu cuenta para continuar.
        </p>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Correo electrónico</span>

            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@gimnasio.com"
            />
          </label>

          <label className="login-field">
            <span>Contraseña</span>

            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="button primary login-submit"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="login-hint">
            <strong>Cuentas demo</strong>
            <span>
              Administrador: admin@gymflow.local / Admin123!
            </span>
            <span>
              Recepción: recepcion@gymflow.local / Recepcion123!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
