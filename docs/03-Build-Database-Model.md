# 03 — Build Database Model

- `db.connection.js` — الاتصال بـ MongoDB عن طريق mongoose
- `Models/user.model.js` — validations على مستوى الـ schema (min/max, enum, required, virtuals, methods, indexes)
- `Models/messages.model.js` — الرسائل + ref للمستخدم
- `Models/black-listed-tokens.model.js` — التوكنات اللي اتعمل لها logout
- `Common/enums/user.enum.js` — Gender / Roles / Providers
