# Clinic Queue Pro

نظام احترافي لإدارة حجوزات العيادة ومتابعة الدور، مبني على:

- React + Vite
- Firebase Hosting
- Cloud Firestore
- Firebase Authentication
- Cloud Functions
- GitHub Actions
- PWA قابل للتثبيت على الموبايل من المتصفح

## الروابط داخل النظام

بعد النشر على Firebase Hosting ستكون الروابط بالشكل التالي:

- `/patient` رابط المريض لمتابعة الدور
- `/admin` لوحة الإدارة والاستقبال
- `/doctor` لوحة الطبيب
- `/display` شاشة الانتظار داخل العيادة

## بيانات Firebase المستخدمة

تم وضع Firebase Config داخل:

```txt
src/firebase/config.ts
```

وتم وضع Admin UID داخل الكود وقواعد الحماية:

```txt
a2uvKrLDoNVPOafbOOM8BlErxek1
```

هذا الحساب سيكون مدير النظام تلقائيًا حتى إذا لم يتم إنشاء مستند له داخل collection اسمها `users`.

## التشغيل المحلي

```bash
npm install
cd functions && npm install && cd ..
npm run dev
```

ثم افتح:

```txt
http://localhost:5173
```

## النشر على Firebase

تأكد أولًا من تثبيت Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
```

ثم نفّذ:

```bash
npm install
cd functions && npm install && cd ..
npm run build
firebase deploy
```

أو نشر جزء محدد:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

## مهم جدًا بخصوص Cloud Functions

صفحة المريض تستخدم Cloud Function اسمها `lookupBooking` لحماية بيانات المرضى وعدم فتح كل الحجوزات للعامة.

لذلك قد تحتاج إلى تفعيل خطة Blaze في Firebase لكي تعمل Cloud Functions حسب إعدادات مشروعك.

## أول تشغيل للنظام

1. افتح Firebase Console.
2. تأكد من وجود حساب Authentication الذي UID الخاص به:

```txt
a2uvKrLDoNVPOafbOOM8BlErxek1
```

3. انشر المشروع.
4. ادخل إلى `/login` وسجل دخول بحساب الإدارة.
5. اذهب إلى `/admin/doctors` وأضف أول طبيب.
6. اذهب إلى `/admin` وأضف أول حجز.
7. جرّب رابط المريض `/patient` برقم الهاتف أو كود الحجز.
8. افتح `/display` على شاشة الانتظار.

## إنشاء حساب طبيب

من Firebase Authentication أنشئ مستخدمًا للطبيب، ثم داخل Firestore أضف مستندًا في collection اسمها `users` بنفس UID:

```json
{
  "role": "doctor",
  "displayName": "د. أحمد محمد",
  "assignedDoctorId": "ضع هنا ID مستند الطبيب من collection doctors"
}
```

## إنشاء حساب استقبال

```json
{
  "role": "reception",
  "displayName": "الاستقبال"
}
```

## Collections المستخدمة

- `users` صلاحيات المستخدمين
- `doctors` بيانات الأطباء
- `patients` بيانات المرضى
- `bookings` الحجوزات
- `queues` حالة الدور لكل طبيب في اليوم
- `publicStatus` بيانات مختصرة للمريض بعد التحقق
- `publicQueues` بيانات شاشة الانتظار
- `activityLogs` سجل العمليات

## الحالات المستخدمة للحجز

- `waiting` منتظر
- `called` تم النداء
- `in_progress` داخل الكشف
- `finished` تم الكشف
- `skipped` تم التخطي
- `postponed` مؤجل
- `cancelled` ملغي
- `no_show` لم يحضر

## ملاحظات أمان

- لا تجعل Firestore مفتوحًا للعامة.
- قواعد الحماية موجودة في `firestore.rules`.
- صفحة المريض لا تقرأ الحجوزات مباشرة، بل تبحث عبر Cloud Function ثم تتابع مستند `publicStatus` فقط.
- Firebase Web Config ليس كلمة سر، لكن حماية النظام تعتمد على Security Rules وCloud Functions.

## GitHub Actions

تم تجهيز ملف:

```txt
.github/workflows/firebase-hosting-merge.yml
```

لكي ينشر Hosting تلقائيًا عند رفع الكود على branch اسمها `main`.

يجب إضافة Secret داخل GitHub باسم:

```txt
FIREBASE_SERVICE_ACCOUNT_MOUHA_8576F
```

يمكن إنشاؤه من Firebase Hosting GitHub Integration أو من Google Cloud Service Account.
