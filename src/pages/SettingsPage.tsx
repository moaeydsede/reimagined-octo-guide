import { ClipboardCopy, ExternalLink, Github, ShieldCheck } from 'lucide-react';
import { Section } from '../components/Cards';
import { AppShell } from '../components/Shell';
import { firebaseConfig } from '../firebase';
import { absoluteAppUrl } from '../utils';

export function SettingsPage() {
  const links = [
    { label: 'الرابط الرئيسي', url: absoluteAppUrl('/') },
    { label: 'رابط المريض', url: absoluteAppUrl('/patient') },
    { label: 'رابط الإدارة', url: absoluteAppUrl('/admin') },
    { label: 'رابط الطبيب', url: absoluteAppUrl('/doctor') },
    { label: 'شاشة الانتظار', url: absoluteAppUrl('/display') }
  ];
  return (
    <AppShell title="إعدادات وروابط النظام" subtitle="روابط جاهزة للمشاركة وتشخيص سريع للإعدادات">
      <div className="split-panel">
        <Section title="روابط التشغيل" subtitle="انسخ الروابط واستخدمها داخل العيادة أو أرسل رابط المريض.">
          <div className="links-list">{links.map((l) => <div key={l.url}><strong>{l.label}</strong><code>{l.url}</code><button className="muted-button small" onClick={() => navigator.clipboard?.writeText(l.url)}><ClipboardCopy size={15} /> نسخ</button><a className="primary-button small" href={l.url} target="_blank"><ExternalLink size={15} /> فتح</a></div>)}</div>
        </Section>
        <Section title="تشخيص Firebase" subtitle="تأكد أن Project ID صحيح وأن Firestore/Auth مفعّلين.">
          <div className="diagnostic"><ShieldCheck /><strong>Project ID</strong><code>{firebaseConfig.projectId}</code><p>يجب نشر قواعد Firestore الموجودة في الملف firestore.rules مرة واحدة من Firebase CLI.</p><p><Github size={16} /> GitHub Pages يحتاج Source = GitHub Actions وليس Static HTML.</p></div>
        </Section>
      </div>
    </AppShell>
  );
}
