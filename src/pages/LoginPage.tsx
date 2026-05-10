import { Loader2, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { safeError } from '../utils';

export function LoginPage() {
  const { login, firebaseUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (firebaseUser) return <Navigate to="/admin" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await login(email, password); }
    catch (err) { setError(safeError(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="login-page">
      <section className="glass-card login-card">
        <div className="login-logo"><LockKeyhole /></div>
        <h1>تسجيل دخول الإدارة</h1>
        <p>ادخل بالحساب الذي تم إنشاؤه داخل Firebase Authentication.</p>
        <form onSubmit={submit}>
          <label>البريد الإلكتروني<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@clinic.com" /></label>
          <label>كلمة المرور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></label>
          <button className="primary-button" disabled={busy}>{busy ? <Loader2 className="spin" /> : <LockKeyhole size={18} />} دخول</button>
        </form>
        {error && <div className="alert danger">{error}</div>}
        <NavLink className="text-link" to="/patient">العودة لرابط المريض</NavLink>
      </section>
    </div>
  );
}
