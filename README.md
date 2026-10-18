# Maya AI — مايا

واجهة عربية متجاوبة للمحادثة النصية والصوتية داخل Chrome. يعتمد الميكروفون والصوت على دعم المتصفح والجهاز. وضع الصوت المتتابع يعيد محاولة تشغيل الميكروفون بين الرسائل لكنه لا يضمن الاستماع الدائم.

## الحالة
- `index.html`: واجهة عربية، محادثة محفوظة محليًا، صوت المتصفح، وإعداد عنوان الخادم.
- `worker.js`: وسيط API لـ Gemini حتى لا ينكشف المفتاح داخل صفحة GitHub العامة.
- الذكاء الاصطناعي لا يعمل قبل نشر Worker وضبط السر `GEMINI_API_KEY` وإدخال عنوان Worker في إعدادات الموقع.
- لا يمكن لموقع ويب التحكم الكامل بتطبيقات الهاتف أو إعداداته.

## تفعيل الخادم المجاني
1. افتح Cloudflare Dashboard: https://dash.cloudflare.com/ ثم Workers & Pages وأنشئ Worker باسم `maya-ai-api`.
2. الصق محتوى `worker.js` في محرر Worker ثم Deploy.
3. أنشئ Gemini API key من https://aistudio.google.com/app/apikey
4. في Worker افتح Settings → Variables and Secrets → Add → Secret. الاسم `GEMINI_API_KEY` والقيمة مفتاحك. لا تنشر المفتاح في GitHub.
5. اختبر عنوان Worker مع `/health`؛ يجب أن يظهر JSON فيه `"ok":true`.
6. افتح موقع GitHub Pages، اضغط ⚙️ إعداد الاتصال، وأدخل عنوان Worker مثل `https://maya-ai-api.<your-subdomain>.workers.dev` ثم احفظ واختبر.

## نشر الواجهة
في GitHub: Settings → Pages → Deploy from a branch، اختر `main` و `/(root)` ثم Save.

## ملاحظات
Gemini API لديه طبقة مجانية وحدود استخدام قابلة للتغيير؛ قد تتوقف الطلبات عند بلوغ الحصة. راجع https://ai.google.dev/gemini-api/docs/pricing . لا تضع مفتاح API في `index.html`. لا يعمل الاستماع دائمًا عند قفل الشاشة.
