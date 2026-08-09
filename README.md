# سكينة (Sakeenah)

تطبيق موبايل بسيط لأذكار الصباح والمساء، مواعيد الصلاة، واتجاه القبلة — مبني بـ [Expo](https://expo.dev) و [expo-router](https://docs.expo.dev/router/introduction).

## الفيتشرز

- أذكار الصباح والمساء والنوم والتسبيح، وبعد الصلاة، ودعاء الكرب — مع عداد تكرار وفضل كل ذكر.
- ستريك مستقل لكل من الصباح والمساء.
- مفضلة وبحث في كل الأذكار.
- مواعيد الصلاة (Aladhan API) مع عداد تنازلي للصلاة الجاية وتذكيرات.
- اتجاه القبلة (بوصلة).
- تذكيرات يومية بوقت مخصص لكل من الصباح والمساء.
- مظهر فاتح/غامق/تلقائي.

## التشغيل محليًا

```bash
npm install
npx expo start
```

هتلاقي خيارات لفتح التطبيق في: development build، محاكي أندرويد، محاكي iOS، أو Expo Go.

## الجودة والاختبارات

```bash
npm run lint        # ESLint
npm run typecheck    # فحص TypeScript
npm run format:check # فحص Prettier
npm test             # Jest
```

كل ده بيتشغل تلقائيًا على GitHub Actions مع كل push/PR (شوف `.github/workflows/ci.yml`).

## البناء والنشر (EAS)

المشروع فيه `eas.json` بثلاث بروفايلز: `development`، `preview`، `production`.

```bash
npx eas login
npx eas build --profile preview --platform android   # بناء تجريبي
npx eas build --profile production --platform all    # بناء نهائي للمتاجر
npx eas submit --profile production --platform ios   # رفع لـ App Store
```

**قبل أول build production لازم:**

1. تراجع `app.json` → `ios.bundleIdentifier` و `android.package` وتتأكد إنهم زي ما عايز فعليًا (حاليًا `com.anonymous.sakeenah`، الأفضل تغيّرهم لدومين حقيقي بتاعك).
2. تعبّي بيانات `eas.json` → `submit.production` (Apple ID، App Store Connect App ID، Team ID، ومسار مفتاح خدمة جوجل لأندرويد).
3. تحدّث الروابط الوهمية في `app/about.tsx` (سياسة الخصوصية وإيميل التواصل) بروابط حقيقية.
4. تجهّز صور المتجر (screenshots) ووصف التطبيق على App Store Connect و Google Play Console — دي حاجات لازم تتعمل من حسابك مباشرة.

## حاجات لسه محتاجة قرار/حساب خارجي

القائمة دي مقصودة عشان توضح حدود اللي أي كود ممكن يعمله من غير تدخل بشري:

- **Crash reporting/analytics**: محتاج حساب Sentry (أو مشابه) وDSN key بتاعك.
- **OTA updates** (`expo-updates`): محتاج EAS project ID بتاعك بعد أول `eas init`.
- **محتوى بعيد (Remote content) للأذكار**: لو حبيت تضيف/تعدّل أذكار من غير App Store review، محتاج backend بسيط (Firebase Remote Config أو JSON مستضاف) — مش موجود حاليًا، الأذكار لسه ثابتة في `data/azkar.ts`.
- **Widgets للشاشة الرئيسية**: بتحتاج كود native ومشروع development build كامل، مش قابلة للتنفيذ في Expo Go.
- **مزامنة سحابية للستريك بين الأجهزة**: محتاج قرار على مزود (Firebase/Supabase) وربط حساب مستخدم.

## البنية

```
app/                    شاشات التطبيق (expo-router)
  (tabs)/                الرئيسية، مواعيد الصلاة، الإعدادات
  azkar/[category].tsx   تفاصيل فئة أذكار
  azkar/favorites.tsx    المفضلة
  qibla.tsx              اتجاه القبلة
  search.tsx             البحث
  about.tsx              عن التطبيق
data/                    بيانات الأذكار، الستريك، المفضلة
lib/                     مواعيد الصلاة، القبلة، الإشعارات
contexts/                ثيم التطبيق (فاتح/غامق)
__tests__/               اختبارات Jest للمنطق الأساسي
```
