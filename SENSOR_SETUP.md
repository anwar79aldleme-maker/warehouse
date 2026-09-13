# ربط قراءة الحرارة RS485 مع صفحة المخزن

## 1) متغيرات Vercel المطلوبة
أضف في Project > Settings > Environment Variables:

- `DATABASE_URL` = رابط اتصال Neon PostgreSQL
- `SENSOR_API_KEY` = كلمة سر طويلة عشوائية خاصة بإرسال الحساس

المشروع يحتاج أيضاً المتغيرات الموجودة سابقاً:
- `APP_USERNAME`
- `APP_PASSWORD`
- `AUTH_SECRET`
- `CAMERA_SERVER_BASE_URL` (عند ربط خادم الكاميرات)

بعد إضافة/تغيير المتغيرات قم بعمل Redeploy.

## 2) قاعدة البيانات
لا تحتاج لإنشاء الجدول يدوياً. أول طلب إلى `/api/sensor` ينشئ جدول `sensor_readings` تلقائياً إن لم يكن موجوداً.

## 3) برنامج Python
ثبت المكتبات:

```bash
pip install pyserial requests
```

ثم افتح `send_temperature.py` وعدّل:

```python
PORT = "COM3"
API_URL = "https://YOUR-PROJECT.vercel.app/api/sensor"
API_KEY = "نفس قيمة SENSOR_API_KEY في Vercel"
```

شغّل:

```bash
python send_temperature.py
```

## 4) ما الذي يحدث؟
Arduino يرسل الحرارة كنص عبر RS485. Python يقرأها من COM3 ويرسلها إلى Vercel. API يحفظ آخر قراءة في Neon. صفحة `warehouse.html` تطلب القراءة كل ثانيتين.

القراءة الحالية مربوطة افتراضياً بـ:
- location: `tikrit`
- warehouse: `1`
- sensor: `1`

إذا لم تصل قراءة خلال 15 ثانية، تعرض الصفحة أن القراءة قديمة.

## 5) الأمان
لا ترفع `SENSOR_API_KEY` الحقيقي إلى GitHub. اترك القيمة الوهمية في ملف Python داخل المستودع، وضع المفتاح الحقيقي فقط على جهاز القراءة وفي Vercel Environment Variables.
