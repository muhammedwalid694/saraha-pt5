# 09 — Repository Pattern

- `repository.js` — كلاس عام (CRUD) بيلف أي Mongoose model.
- `user.repository.js` / `messages.repository.js` / `black-listed-tokens.repository.js` — بيورّثوا منه ويضيفوا ميثودز خاصة (`findByEmail`, `findAllWithReceiver`, `findByTokenId`...).
- الـ Services مبتكلمش الـ Model مباشرة، بتنادي الـ Repository بس.
