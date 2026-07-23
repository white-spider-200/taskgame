import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { TeamForms } from "@/components/TeamForms";
import Link from "next/link";

export default async function TeamsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#FFF7EC",
        padding: "32px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <Logo size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 24, color: "#2B2118" }}>فرقك</div>
            <div style={{ color: "#9A8A73", fontWeight: 600, fontSize: 14 }}>
              مرحبًا {user.name}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "2px solid #FFE3B3",
                borderRadius: 999,
                padding: "6px 14px",
                color: "#7A6A55",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              خروج
            </button>
          </form>
        </div>

        {memberships.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {memberships.map((m) => (
              <Link
                key={m.id}
                href={`/t/${m.teamId}`}
                style={{
                  background: "#FFF",
                  border: "2px solid #FFE3B3",
                  borderRadius: 16,
                  padding: "14px 18px",
                  textDecoration: "none",
                  color: "#2B2118",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {m.team.name}
                <span
                  style={{
                    color: "#9A8A73",
                    fontWeight: 600,
                    fontSize: 13,
                    marginInlineStart: 10,
                  }}
                >
                  {m.role === "owner" ? "مالك" : "عضو"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "#FFF",
              border: "2px solid #FFE3B3",
              borderRadius: 16,
              padding: 20,
              marginBottom: 28,
              color: "#9A8A73",
              fontWeight: 600,
            }}
          >
            لست عضوًا في أي فريق بعد — أنشئ فريقًا أو انضم برمز الدعوة.
          </div>
        )}

        <TeamForms />
      </div>
    </div>
  );
}
