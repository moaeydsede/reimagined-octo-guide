import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('بيانات الدخول غير صحيحة أو الحساب غير موجود في Firebase Auth.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card glass-card">
        <div className="login-logo"><ShieldCheck size={34} /></div>
        <h1>Clinic Queue Pro</h1>
        <p>تسجيل دخول الإدارة والطبيب</p>
        <form onSubmit={handleSubmit}>
          <label>البريد الإلكتروني</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@clinic.com" required />
          <label>كلمة المرور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
          {error && <div className="alert danger">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
        </form>
      </section>
    </main>
  );
}
