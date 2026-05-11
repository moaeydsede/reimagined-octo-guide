import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Eye, Lock, Mail } from 'lucide-react'
import Brand from '../components/Brand'
import { ADMIN_UID, auth } from '../lib/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'doctor'>('admin')
  const [message, setMessage] = useState('')
  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await signInWithEmailAndPassword(auth, email, password)
      setMessage(user.user.uid === ADMIN_UID || role === 'doctor' ? 'تم تسجيل الدخول بنجاح' : 'تم تسجيل الدخول')
      setTimeout(() => { location.href = role === 'admin' ? `${import.meta.env.BASE_URL}admin` : `${import.meta.env.BASE_URL}doctor` }, 600)
    } catch {
      setMessage('تعذر تسجيل الدخول، تأكد من البريد وكلمة المرور')
    }
  }
  return <section className="login-page fade-in">
    <form className="login-card" onSubmit={login}>
      <Brand />
      <h1>تسجيل الدخول</h1>
      <p>الوصول الآمن إلى لوحة الإدارة والطبيب</p>
      <div className="role-toggle"><button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>إدارة / استقبال</button><button type="button" className={role === 'doctor' ? 'active' : ''} onClick={() => setRole('doctor')}>طبيب</button></div>
      <label><Mail size={18}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" /></label>
      <label><Lock size={18}/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" /><Eye size={18}/></label>
      <button className="primary-btn">تسجيل الدخول</button>
      {message && <div className="form-message">{message}</div>}
    </form>
  </section>
}
