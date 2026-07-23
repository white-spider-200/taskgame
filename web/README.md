<p align="center">
  <img src="./public/logo.png" alt="ملعب المهام" width="120" />
</p>

<h1 align="center">ملعب المهام</h1>

<p align="center">
  <strong>Task Playground</strong> — فريقك يلعب، ينجز، ويتنافس ⏱️⭐
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma" />
  <img alt="RTL" src="https://img.shields.io/badge/UI-Arabic_RTL-FF6B57?style=for-the-badge" />
</p>

---

## ليه ملعب المهام؟

مش مجرد قائمة تودو. هذي ساحة لعب للفريق:

| 🏃‍♂️ | ⭐ | 🏆 |
|:---:|:---:|:---:|
| مؤقّت حي على كل مهمة | تقييم نجوم من الزملاء | لوحة متصدرين ونقاط |

خلفية كريمية دافئة `#FFF7EC`، حدود عسلية، وأزرار مرجانية — نفس روح البروتوتايب الأصلي، بصيغة تطبيق كامل.

---

## ابدأ بسرعة

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

افتح 👉 [http://localhost:3000](http://localhost:3000)

> كلمة السر لكل حسابات الديمو: **`demo1234`**

| الإيميل | الاسم |
|---------|--------|
| `sara@demo.local` | سارة العتيبي |
| `ahmed@demo.local` | أحمد |
| `noura@demo.local` | نورة |
| `khaled@demo.local` | خالد |
| `mhd@demo.local` | محمد |

رمز دعوة الفريق التجريبي: **`MARKETING`**

---

## ماذا داخل الملعب؟

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐
│   المهام    │  │ لوحة الإنجاز │  │  المتصدرون  │  │   ملفي   │
│  مؤقّت حي   │  │   إحصائيات   │  │   ترتيب     │  │  شارات   │
└─────────────┘  └──────────────┘  └─────────────┘  └──────────┘
```

- **تسجيل / دخول** — جلسات كوكيز (JWT + bcrypt)
- **فرق** — أنشئ فريقًا أو انضم برمز دعوة
- **مهام** — تشغيل → إثبات عمل → تقييم زميل → نقاط
- **إثبات** — نص و/أو صورة (حتى 5MB)
- **نقاط** — أساس العضوية + `نجوم × 2` لكل مهمة منجزة

---

## التقنيات

| طبقة | الاختيار |
|------|----------|
| UI | Next.js App Router · React 19 · TypeScript |
| بيانات | Prisma · SQLite (`prisma/dev.db`) — جاهز لـ Postgres |
| أنماط | Tailwind v4 + ستايل دافئ مطابق للبروتوتايب |
| تحقق | Zod على النماذج |

---

## أوامر مفيدة

```bash
npm run dev          # تطوير
npm run build        # بناء إنتاج
npm run lint         # ESLint
npm run db:seed      # إعادة بذر الديمو
npm run db:reset     # إسقاط القاعدة + بذر من جديد
npm run db:migrate   # prisma migrate dev
```

---

## هيكل الواجهة

```
src/
├── app/                 # الصفحات + actions.ts (كل الطفرات)
├── components/
│   ├── Logo.tsx         # علامة م المرجانية
│   ├── Playground.tsx   # الهيكل + الحالة
│   └── playground/      # المهام · اللوحة · المتصدرون · ملفي
└── lib/                 # auth · db · format · team
```

---

## الشعار

<p align="center">
  <img src="./public/logo.svg" alt="شعار ملعب المهام" width="72" />
  &nbsp;&nbsp;
  <img src="./public/logo.png" alt="شعار PNG" width="72" />
</p>

الملفّات: `public/logo.svg` · `public/logo.png`  
المكوّن: `src/components/Logo.tsx` — بلاطة مرجانية مائلة بحرف **م** وظل ضغطي `#E04B38`.

---

<p align="center">
  <sub>بُني للفرق اللي تحب اللعب والإنجاز معًا 🎈</sub>
</p>
