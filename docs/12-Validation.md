# 12 — Validation (Joi)

- `Validators/Schemas/uaer.schema.js` — schemas بصيغة `{ body, params, query, headers }`
  - `SignUpSchema`: الأسماء alphanum 3-20، إيميل صحيح، باسورد قوي (حرف كبير + صغير + رقم + رمز، 8+)، `confirmPassword` لازم يساوي `password`، سن 1-120.
  - `SignUpGmailSchema`: `idToken` بس.
- `validation.middleware.js` — بيعدّي على كل جزء من الـ request، يجمّع كل الأخطاء (`abortEarly: false`) ويرجّع 400 قبل ما يوصل للـ service.

```js
router.post('/register', validationMiddleware(SignUpSchema), SignUpService)
```
