"use client";

import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions";
import { AuthFooter, AuthShell, Field } from "@/components/AuthShell";

type AuthResult = { error: string } | void;

async function loginBound(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  return loginAction(formData);
}

async function registerBound(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  return registerAction(formData);
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginBound, undefined);

  return (
    <AuthShell title="تسجيل الدخول" subtitle="ادخل إلى ملعب المهام مع فريقك">
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="البريد" name="email" type="email" placeholder="sara@demo.local" />
        <Field label="كلمة المرور" name="password" type="password" placeholder="••••••••" />
        {state?.error ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 14 }}>{state.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 8,
            background: "#FF6B57",
            color: "#FFF",
            fontWeight: 800,
            fontSize: 16,
            padding: 13,
            borderRadius: 999,
            boxShadow: "0 3px 0 #E04B38",
            border: "none",
            cursor: "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "..." : "دخول"}
        </button>
      </form>
      <p
        style={{
          marginTop: 18,
          textAlign: "center",
          color: "#9A8A73",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        حساب تجريبي: <code>sara@demo.local</code> / <code>demo1234</code>
      </p>
      <AuthFooter prompt="ليس لديك حساب؟" href="/register" linkText="إنشاء حساب" />
    </AuthShell>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerBound, undefined);

  return (
    <AuthShell title="إنشاء حساب" subtitle="انضم لملعب المهام وابدأ مع فريقك">
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="الاسم" name="name" type="text" placeholder="سارة العتيبي" />
        <Field label="البريد" name="email" type="email" placeholder="you@example.com" />
        <Field
          label="كلمة المرور"
          name="password"
          type="password"
          placeholder="٤ أحرف على الأقل"
        />
        {state?.error ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 14 }}>{state.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 8,
            background: "#1FB6A6",
            color: "#FFF",
            fontWeight: 800,
            fontSize: 16,
            padding: 13,
            borderRadius: 999,
            boxShadow: "0 3px 0 #148F82",
            border: "none",
            cursor: "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "..." : "إنشاء الحساب"}
        </button>
      </form>
      <AuthFooter prompt="لديك حساب؟" href="/login" linkText="تسجيل الدخول" />
    </AuthShell>
  );
}
