# Clinic Queue Pro

نظام احترافي عربي RTL للحجوزات ومتابعة دور المرضى للعيادات، يعمل على:

- GitHub Pages للواجهة
- Firebase Authentication لتسجيل دخول الإدارة والطبيب
- Cloud Firestore لقاعدة البيانات والتحديث اللحظي
- PWA كتطبيق موبايل قابل للتثبيت من المتصفح

## الروابط بعد النشر على GitHub Pages

```txt
https://moaeydsede.github.io/reimagined-octo-guide/
https://moaeydsede.github.io/reimagined-octo-guide/patient
https://moaeydsede.github.io/reimagined-octo-guide/admin
https://moaeydsede.github.io/reimagined-octo-guide/doctor
https://moaeydsede.github.io/reimagined-octo-guide/display
https://moaeydsede.github.io/reimagined-octo-guide/login
```

## بيانات Firebase الموجودة في المشروع

Project ID:

```txt
mouha-8576f
```

Admin UID:

```txt
a2uvKrLDoNVPOafbOOM8BlErxek1
```

## طريقة الرفع على GitHub

1. فك ضغط الملف.
2. ارفع محتويات المجلد إلى مستودع GitHub باسم:

```txt
reimagined-octo-guide
```

3. ادخل إلى:

```txt
Settings → Pages → Source → GitHub Actions
```

4. افتح تبويب Actions وشغل workflow:

```txt
Deploy to GitHub Pages
```

5. انتظر علامة الصح الخضراء ثم افتح الرابط.

## خطوات Firebase الضرورية

### 1. تفعيل Authentication

من Firebase Console:

```txt
Authentication → Sign-in method → Email/Password → Enable
```

ثم أنشئ مستخدم الإدارة. يجب أن يكون UID هو:

```txt
a2uvKrLDoNVPOafbOOM8BlErxek1
```

إذا كان UID مختلفًا، غيّر القيمة في ملفين:

```txt
src/config.ts
firestore.rules
```

### 2. تفعيل Firestore

من Firebase Console:

```txt
Firestore Database → Create database
```

### 3. نشر قواعد Firestore

على جهازك بعد تثبيت Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use mouha-8576f
firebase deploy --only firestore:rules,firestore:indexes
```

أو من المشروع:

```bash
npm run rules:deploy
```

## التشغيل المحلي

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
```

## أهم المميزات

- رابط للمريض للبحث برقم الهاتف أو كود الحجز
- لوحة إدارة احترافية للحجوزات
- إضافة أطباء وغرف كشف
- رقم دور تلقائي لكل طبيب وكل يوم
- نداء التالي
- تخطي المريض
- تأجيل المريض
- إرجاع المريض للانتظار
- شاشة الطبيب
- شاشة انتظار عامة
- واتساب واتصال من لوحة الإدارة
- تقارير يومية
- إعدادات وروابط جاهزة للنسخ
- دعم كامل للعربية RTL
- PWA قابل للتثبيت على الموبايل

## ملاحظة مهمة عن الشاشة البيضاء

إذا ظهرت شاشة بيضاء، السبب غالبًا أن GitHub Pages لم يشغل GitHub Actions أو تم رفع ملفات المصدر كـ Static HTML. الحل:

```txt
Settings → Pages → Source = GitHub Actions
Actions → Deploy to GitHub Pages → Run workflow
```

المشروع يحتوي بالفعل على:

```txt
vite.config.ts
.github/workflows/deploy-github-pages.yml
scripts/copy-404.cjs
```

وهذه الملفات تضبط المسار الصحيح:

```txt
/reimagined-octo-guide/
```
