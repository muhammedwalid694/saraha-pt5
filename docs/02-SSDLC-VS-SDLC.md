# 02 — SSDLC vs SDLC

| | SDLC | SSDLC (Secure SDLC) |
|---|---|---|
| الهدف | تسليم البرنامج شغال في الوقت المحدد | تسليم برنامج شغال **وآمن** |
| الأمان | غالبًا بيتفحص في الآخر (Testing) | داخل في **كل مرحلة** من البداية |
| Requirements | وظائف بس | وظائف + متطلبات أمان (Auth, Roles, Encryption) |
| Design | Architecture عادي | + Threat Modeling |
| Development | كتابة الكود | + Secure Coding, Code Review, عدم تسريب الأسرار |
| Testing | Unit / Integration | + SAST, DAST, Penetration Testing |
| Deployment | نشر | + Hardening, Secrets Management |
| Maintenance | Bug fixes | + Patching الثغرات, Monitoring |
| تكلفة إصلاح الثغرة | عالية (بتتكتشف متأخر) | أقل (بتتكتشف بدري — Shift Left) |

## المراحل
SDLC: Planning → Requirements → Design → Development → Testing → Deployment → Maintenance
SSDLC: نفس المراحل، وفي كل مرحلة نشاط أمان.

## تطبيق ده في مشروع Saraha
- Hashing للباسورد (bcrypt) → فولدر 06
- Encryption لرقم الموبايل → فولدر 05
- Environment variables للأسرار → فولدر 08
- Token + Blacklist + Authorization → فولدر 11
- Validation على المدخلات → فولدر 12
- Error handling من غير تسريب تفاصيل داخلية → فولدر 10
