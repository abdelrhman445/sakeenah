<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F1720,100:7FE3C0&height=220&section=header&text=سكينة&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=Sakeenah%20-%20A%20Path%20to%20Tranquility&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<a href="https://github.com" target="_blank">
  <img src="https://readme-typing-svg.demolab.com?font=Amiri&size=26&duration=3500&pause=900&color=7FE3C0&center=true&vCenter=true&width=560&lines=%D9%88%D9%8E%D8%A7%D8%B7%D9%92%D9%85%D9%8E%D8%A6%D9%90%D9%86%D9%91%D9%8E+%D9%82%D9%8F%D9%84%D9%88%D8%A8%D9%8F%D9%87%D9%85+%D8%A8%D9%90%D8%B0%D9%90%D9%83%D9%92%D8%B1%D9%90+%D8%A7%D9%84%D9%84%D9%91%D9%8E%D9%87%D9%90;Daily+Azkar+%E2%80%A2+Prayer+Times+%E2%80%A2+Qibla+%E2%80%A2+Quran" alt="typing-svg" />
</a>

<br/>

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/Tested_with-Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-Private-lightgrey?style=for-the-badge)

</div>

<div align="center" dir="rtl">

### ﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾

**صدق الله العظيم — سورة الرعد، آية 28**

</div>

<br/>

<div dir="rtl">

## 🌙 عن التطبيق

**سكينة** رفيقك اليومي للطمأنينة — تطبيق موبايل هادئ وبسيط، بعيد عن أي تشتيت أو إعلانات، يجمع أذكار الصباح والمساء، مواعيد الصلاة، اتجاه القبلة، والقرآن الكريم في مكان واحد أنيق.
مبني بـ [Expo](https://expo.dev) و [expo-router](https://docs.expo.dev/router/introduction) بمعمارية نظيفة وقابلة للتوسّع.

<br/>

## ✨ المميزات

| الميزة                | التفاصيل                                                                    |
| --------------------- | --------------------------------------------------------------------------- |
| 📿 **الأذكار**        | صباح، مساء، نوم، تسبيح، بعد الصلاة، ودعاء الكرب — مع عداد تكرار وفضل كل ذكر |
| 🔥 **الستريك**        | عداد أيام مستقل لكل من أذكار الصباح والمساء                                 |
| ⭐ **المفضلة والبحث** | حفظ أي ذكر في المفضلة، وبحث فوري في كل الأذكار                              |
| 🕌 **مواعيد الصلاة**  | حساب دقيق عبر Aladhan API، مع عداد تنازلي للصلاة القادمة وتذكيرات           |
| 🧭 **اتجاه القبلة**   | بوصلة حيّة تعتمد على حساسات الجهاز                                          |
| 📖 **القرآن الكريم**  | قراءة وتصفح، حفظ التقدم، وختمة قابلة للمتابعة                               |
| 🔔 **تذكيرات مخصصة**  | وقت منفصل قابل للتخصيص لتذكير الصباح والمساء                                |
| 🌗 **المظهر**         | فاتح / غامق / تلقائي حسب النظام                                             |

<br/>

## 🛠️ التقنية

```
Expo 54  ·  React Native 0.81  ·  TypeScript  ·  expo-router
AsyncStorage (تخزين محلي)  ·  expo-location + expo-sensors (القبلة)
expo-notifications (تذكيرات)  ·  Aladhan API (مواعيد الصلاة)
Jest + jest-expo (اختبارات)  ·  ESLint + Prettier  ·  EAS Build
```

<br/>

## 🚀 التشغيل محليًا

```bash
npm install
npx expo start
```

هتلاقي خيارات لفتح التطبيق في: development build، محاكي أندرويد، محاكي iOS، أو Expo Go.

<br/>

## 🧪 الجودة والاختبارات

```bash
npm run lint          # ESLint
npm run typecheck     # فحص TypeScript
npm run format:check  # فحص Prettier
npm test              # Jest
```

> كل ده بيتشغل تلقائيًا على GitHub Actions مع كل push/PR — راجع `.github/workflows/ci.yml`

<br/>

## 📦 البناء والنشر (EAS)

المشروع فيه `eas.json` بثلاث بروفايلز: `development` · `preview` · `production`

```bash
npx eas login
npx eas build --profile preview --platform android   # بناء تجريبي
npx eas build --profile production --platform all    # بناء نهائي للمتاجر
npx eas submit --profile production --platform ios   # رفع لـ App Store
```

<details>
<summary><b>⚠️ قبل أول build production — لازم تعمل الآتي</b></summary>

<br/>

1. راجع `app.json` → `ios.bundleIdentifier` و `android.package` وغيّرهم من `com.anonymous.sakeenah` لدومين حقيقي بتاعك
2. عبّي بيانات `eas.json` → `submit.production` (Apple ID، App Store Connect App ID، Team ID، مفتاح خدمة جوجل لأندرويد)
3. حدّث الروابط الوهمية في `app/about.tsx` (سياسة الخصوصية وإيميل التواصل) بروابط حقيقية
4. جهّز صور المتجر (screenshots) ووصف التطبيق على App Store Connect و Google Play Console

</details>

<br/>

## 📁 البنية

```
app/                    شاشات التطبيق (expo-router)
  (tabs)/                الرئيسية، مواعيد الصلاة، القرآن، الإعدادات
  azkar/[category].tsx   تفاصيل فئة أذكار
  azkar/favorites.tsx    المفضلة
  quran/[id].tsx          قراءة سورة
  quran/favorites.tsx    مفضلة القرآن
  qibla.tsx              اتجاه القبلة
  search.tsx             البحث
  about.tsx              عن التطبيق
data/                    بيانات الأذكار، القرآن، الستريك، المفضلة، الختمة
lib/                     مواعيد الصلاة، القبلة، الإشعارات، التقويم الهجري
contexts/                ثيم التطبيق (فاتح/غامق)
__tests__/               اختبارات Jest للمنطق الأساسي
```

<br/>

## 🗺️ حاجات لسه محتاجة قرار/حساب خارجي

| البند                        | الوضع                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Crash reporting / Analytics  | محتاج حساب Sentry (أو مشابه) وDSN key                                                                                                  |
| OTA Updates (`expo-updates`) | محتاج EAS project ID بعد أول `eas init`                                                                                                |
| محتوى بعيد للأذكار           | الأذكار لسه ثابتة في `data/azkar.ts` — لو حابب تعديل بدون App Store review، محتاج backend بسيط (Firebase Remote Config أو JSON مستضاف) |
| Widgets للشاشة الرئيسية      | محتاجة كود native ومشروع development build كامل — مش قابلة للتنفيذ في Expo Go                                                          |
| مزامنة سحابية للستريك        | محتاج قرار على مزود (Firebase/Supabase) وربط حساب مستخدم                                                                               |

<br/>

## 🤝 المساهمة

الـ Pull Requests مرحّب بيها. لأي تغيير كبير، افتح Issue الأول لمناقشة اللي عايز تغيّره.

## 📜 الرخصة

مشروع خاص — كل الحقوق محفوظة.

</div>

<br/>

<div align="center">

### 🤲 _"اللهم اجعل القرآن ربيع قلوبنا، ونور صدورنا، وجلاء أحزاننا"_

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7FE3C0,100:0F1720&height=120&section=footer" width="100%"/>

</div>
