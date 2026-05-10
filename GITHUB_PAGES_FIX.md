# إصلاح الشاشة البيضاء على GitHub Pages

سبب الشاشة البيضاء غالبًا أن مشروع Vite لا يعمل مباشرة من ملفات السورس على GitHub Pages، ولازم يتعمله build ويستخدم base باسم المستودع.

## الخطوات

1. ارفع محتويات هذا المشروع إلى المستودع `reimagined-octo-guide`.
2. من GitHub افتح:
   Settings → Pages
3. في Source اختر:
   **GitHub Actions**
4. من تبويب Actions شغّل Workflow باسم:
   **Deploy to GitHub Pages**
5. بعد نجاح النشر افتح:
   https://moaeydsede.github.io/reimagined-octo-guide/

## الروابط بعد الإصلاح

- /reimagined-octo-guide/patient
- /reimagined-octo-guide/login
- /reimagined-octo-guide/admin
- /reimagined-octo-guide/doctor
- /reimagined-octo-guide/display

## لو غيرت اسم المستودع

افتح `.github/workflows/deploy-github-pages.yml` وغير:

```bash
npm run build:github
```

أو غير `VITE_BASE_PATH` في `package.json` إلى اسم المستودع الجديد.
