import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

async function main() {
  await prisma.rating.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = Date.now();

  const users = await Promise.all(
    [
      { email: "sara@demo.local", name: "سارة العتيبي", initial: "س", color: "#1FB6A6", base: 118 },
      { email: "ahmed@demo.local", name: "أحمد", initial: "أ", color: "#FF9F43", base: 117 },
      { email: "noura@demo.local", name: "نورة", initial: "ن", color: "#8B5CF6", base: 98 },
      { email: "khaled@demo.local", name: "خالد", initial: "خ", color: "#FF6B57", base: 68 },
      { email: "mhd@demo.local", name: "محمد", initial: "م", color: "#3D9BE9", base: 56 },
    ].map((u) =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          initial: u.initial,
          color: u.color,
          passwordHash,
        },
      }),
    ),
  );

  const [sara, ahmed, noura, khaled, mhd] = users;
  const bases = [118, 117, 98, 68, 56];

  const team = await prisma.team.create({
    data: {
      name: "فريق التسويق",
      inviteCode: "MARKETING",
      memberships: {
        create: users.map((u, i) => ({
          userId: u.id,
          role: i === 0 ? "owner" : "member",
          basePoints: bases[i]!,
        })),
      },
    },
  });

  const t1 = await prisma.task.create({
    data: {
      title: "تجهيز عرض العميل الجديد",
      category: "مبيعات",
      status: "running",
      startedAt: new Date(now - 3765000),
      teamId: team.id,
      ownerId: ahmed!.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "تصميم صفحة الهبوط",
      desc: "مع نسخة الجوال وقسم الأسئلة الشائعة",
      category: "تصميم",
      status: "review",
      startedAt: new Date(now - 9600000),
      elapsedMs: 9600000,
      teamId: team.id,
      ownerId: noura!.id,
      submission: {
        create: {
          type: "text",
          text: "أنهيت تصميم الصفحة مع نسخة الجوال وقسم الأسئلة الشائعة، جاهزة للمراجعة.",
        },
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "تحديث قائمة العملاء",
      category: "إداري",
      status: "review",
      startedAt: new Date(now - 2520000),
      elapsedMs: 2520000,
      teamId: team.id,
      ownerId: sara!.id,
      submission: {
        create: {
          type: "text",
          text: "حدّثت قائمة العملاء وأضفت جهات الاتصال الناقصة.",
        },
      },
    },
  });

  const doneTasks = [
    {
      title: "مراجعة تقرير المبيعات",
      category: "مبيعات",
      elapsedMs: 4500000,
      ownerId: khaled!.id,
      stars: 4,
      raterId: mhd!.id,
      proof: "راجعت التقرير وصححت الأرقام في قسم الربع الحالي.",
    },
    {
      title: "حملة السوشيال ميديا",
      category: "تصميم",
      elapsedMs: 3300000,
      ownerId: sara!.id,
      stars: 5,
      raterId: ahmed!.id,
      proof: "أنشأت تصاميم الحملة ونشرت المسودات على قناة الفريق.",
    },
    {
      title: "إعداد اجتماع الربع",
      category: "إداري",
      elapsedMs: 5400000,
      ownerId: mhd!.id,
      stars: 4,
      raterId: sara!.id,
      proof: "جهّزت جدول الأعمال والعرض التقديمي للاجتماع.",
    },
  ];

  for (const d of doneTasks) {
    const task = await prisma.task.create({
      data: {
        title: d.title,
        category: d.category,
        status: "done",
        startedAt: new Date(now - d.elapsedMs - 60000),
        elapsedMs: d.elapsedMs,
        completedAt: new Date(now - 60000),
        teamId: team.id,
        ownerId: d.ownerId,
        submission: {
          create: {
            type: "text",
            text: d.proof,
          },
        },
      },
    });
    await prisma.rating.create({
      data: { taskId: task.id, raterId: d.raterId, stars: d.stars },
    });
  }

  void t1;

  console.log("Seeded demo team:");
  console.log("  Team:", team.name, "| invite:", team.inviteCode);
  console.log("  Login as any demo user / password:", DEMO_PASSWORD);
  console.log("  e.g. sara@demo.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
