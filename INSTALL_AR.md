# تعليمات التركيب السريعة

## 1) ارفع الملفات

ارفع كل محتويات المجلد على GitHub داخل المستودع:

```txt
reimagined-octo-guide
```

## 2) اضبط GitHub Pages

```txt
Settings → Pages → Source → GitHub Actions
```

ثم:

```txt
Actions → Deploy to GitHub Pages → Run workflow
```

## 3) اضبط Firebase

فعّل:

```txt
Authentication Email/Password
Firestore Database
```

ثم انشر قواعد Firestore:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 4) أول استخدام

افتح:

```txt
/login
```

ثم:

```txt
/admin/doctors
```

أضف الطبيب، وبعدها افتح:

```txt
/admin
```

وأضف أول حجز.
