# 05 — Build Authentication Module [Encryption]

- **Register** + إرسال كود تأكيد على الإيميل (`send-email.ulils.js` + EventEmitter)
- **Confirm Email** بالـ OTP
- **Encryption** (AES-256-CBC، قابلة للفك) لرقم الموبايل: `encrypt()` وقت التسجيل و`decrypt()` وقت عرض الـ users للأدمن
- **Authorization** بالـ Roles

> تنبيه: في المشروع الأصلي `ListUsersService` كان بيعمل `decrypt()` لرقم الموبايل لكن `SignUpService` كان بيخزّنه من غير `encrypt()`، فكان `/list` هيطلّع error. هنا اتصلّحت بإضافة `encrypt(phoneNumber)` في التسجيل.
> (الحسابات القديمة اللي في الداتابيز بتحتاج تتسجل من جديد.)
