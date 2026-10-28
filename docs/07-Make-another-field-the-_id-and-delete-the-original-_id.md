# 07 — Make another field the _id and delete the original _id

في `user.model.js`:
```js
_id: { type: String },          // الإيميل هو الـ _id
...
{ _id: false, ... }             // تعطيل الـ ObjectId التلقائي

userSchema.pre('validate', function (next) {
  if (!this._id) this._id = this.email
  next()
})
```
- الإيميل unique أصلًا، فالـ `_id` نفسه بيضمن ده.
- في `messages.model.js` الـ `receiverId` بقى `String` عشان يطابق نوع الـ `_id` الجديد، والـ `ref` = `"user"` (نفس اسم الموديل بالظبط).
- الـ `_id` مبيتعدلش في MongoDB، فتغيير الإيميل مش هيغيّره.
