# 04 — Update and Delete Methods

- `PUT /api/users/update` — تعديل بيانات الحساب (`findByIdAndUpdate`)
- `PUT /api/users/update-password` — تغيير الباسورد بعد التأكد من القديم
- `DELETE /api/users/delete` — حذف الحساب + حذف كل رسائله (`deleteMany`)

الـ `_id` بييجي من `req.loggedInUser.user` (الـ authentication middleware في فولدر 11).
