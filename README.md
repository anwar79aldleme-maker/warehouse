# نظام مراقبة المخازن – GitHub + Vercel API

هذا المشروع هو نسخة جاهزة للرفع إلى GitHub ثم النشر على Vercel. الواجهة عربية RTL، والـ API يدير تسجيل الدخول وروابط الكاميرات بدون وضع كلمات مرور الكاميرات داخل GitHub.

## البنية

- `index.html` تسجيل الدخول.
- `locations.html` اختيار الموقع.
- `warehouses.html` قائمة المخازن.
- `warehouse.html` تفاصيل المخزن والكاميرات والحساسات.
- `api/login.js` تسجيل دخول آمن باستخدام متغيرات Vercel.
- `api/session.js` التحقق من الجلسة.
- `api/logout.js` تسجيل الخروج.
- `api/cameras.js` يعيد روابط الكاميرات للواجهة.
- `data/cameras.json` خريطة المواقع والمخازن ومسارات MediaMTX.

## مهم جداً

Vercel لا يتصل مباشرة بعنوان كاميرا محلي مثل `192.168.1.107`، ولا يقوم الـ API بتحويل RTSP إلى فيديو. يجب أن يكون MediaMTX متاحاً بعنوان HTTPS عام. يضع Vercel هذا العنوان في متغير البيئة `CAMERA_SERVER_BASE_URL` ثم يبني روابط البث للواجهة.

المسار النهائي:

`IP Camera -> RTSP -> MediaMTX -> Public HTTPS URL -> Vercel API -> Website`

## 1) إعداد MediaMTX

الكاميرا الحالية مربوطة في `data/cameras.json` بمسار:

`camera1`

مثال MediaMTX محلي:

```yaml
paths:
  camera1:
    source: rtsp://admin:YOUR_PASSWORD@192.168.1.107:8554/Streaming/Channels/101
```

لا ترفع كلمة مرور الكاميرا إلى GitHub. تبقى فقط على جهاز MediaMTX.

## 2) رفع المشروع إلى GitHub

أنشئ Repository جديداً ثم ارفع جميع ملفات هذا المجلد مع الحفاظ على المجلدات:

- `api`
- `css`
- `data`
- `images`
- `js`
- `lib`

## 3) ربط GitHub مع Vercel

من Vercel اختر **Add New Project** ثم استورد Repository من GitHub. لا تحتاج Framework خاص؛ Vercel سيخدم ملفات HTML الثابتة ويشغّل مجلد `api` كـ Functions.

## 4) Environment Variables في Vercel

من:

`Project -> Settings -> Environment Variables`

أضف:

- `APP_USERNAME` = اسم المستخدم الذي تريده
- `APP_PASSWORD` = كلمة مرور قوية
- `AUTH_SECRET` = نص عشوائي طويل جداً، يفضل 32 بايت أو أكثر
- `CAMERA_SERVER_BASE_URL` = عنوان MediaMTX العام، بدون `/camera1` في النهاية

مثال:

`CAMERA_SERVER_BASE_URL=https://your-public-media-server.example`

بعد تعديل Environment Variables أعد نشر المشروع حتى تدخل القيم الجديدة حيز التنفيذ.

## 5) إضافة كاميرات جديدة

حرر `data/cameras.json`.

مثال إضافة كاميرا ثانية للمخزن 1 في تكريت:

```json
"1": {
  "1": { "path": "camera1", "name": "كاميرا 1", "enabled": true },
  "2": { "path": "camera2", "name": "كاميرا 2", "enabled": true }
}
```

وفي MediaMTX يجب أن يوجد المسار نفسه `camera2`.

## الأمان

- لا تضع اسم مستخدم أو كلمة مرور RTSP في GitHub.
- لا تفتح منفذ RTSP للكاميرا مباشرة للعالم.
- استخدم HTTPS عام أمام MediaMTX.
- تسجيل الدخول في هذه النسخة أصبح Server-side session cookie بدلاً من `localStorage` التجريبي القديم.

## ملاحظة عن الحساسات

قراءات الحرارة والرطوبة ما تزال تجريبية في الواجهة. يمكن لاحقاً إضافة API للحساسات وربطه بـ Raspberry Pi / Modbus TCP بنفس بنية `/api/cameras`.

## Real RS485 temperature sensor
This build adds `/api/sensor` and `send_temperature.py`.
See `SENSOR_SETUP.md` for the complete setup.
