# إصلاح GitHub Pages

المشروع مضبوط مسبقًا على اسم المستودع:

```txt
reimagined-octo-guide
```

داخل `vite.config.ts`:

```ts
base: '/reimagined-octo-guide/'
```

لا تستخدم Static HTML أو Jekyll. استخدم فقط:

```txt
Source: GitHub Actions
```

بعد أي تعديل اذهب إلى Actions وشغل:

```txt
Deploy to GitHub Pages
```
