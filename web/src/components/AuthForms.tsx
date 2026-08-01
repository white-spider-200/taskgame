"use client";

import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/actions";
import { AuthFooter, AuthShell, Field } from "@/components/AuthShell";

type AuthResult = { error: string } | void;
type ForgotResult = { error: string } | { success: string } | void;

async function loginBound(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  return loginAction(formData);
}

async function registerBound(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  return registerAction(formData);
}

async function forgotBound(_prev: ForgotResult, formData: FormData): Promise<ForgotResult> {
  return requestPasswordResetAction(formData);
}

async function resetBound(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  return resetPasswordAction(formData);
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
      <p style={{ marginTop: 10, textAlign: "center", fontWeight: 600, fontSize: 14 }}>
        <a href="/forgot-password" style={{ color: "#9A8A73" }}>
          نسيت كلمة المرور؟
        </a>
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

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotBound, undefined);
  const success = state && "success" in state ? state.success : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <AuthShell title="نسيت كلمة المرور" subtitle="أدخل بريدك وسنحضّر لك رابط إعادة التعيين">
      {success ? (
        <p style={{ color: "#1FB6A6", fontWeight: 700, fontSize: 14.5, lineHeight: 1.6 }}>
          {success}
        </p>
      ) : (
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="البريد" name="email" type="email" placeholder="you@example.com" />
          {error ? (
            <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 14 }}>{error}</div>
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
            {pending ? "..." : "إرسال"}
          </button>
        </form>
      )}
      <AuthFooter prompt="تذكرت كلمة المرور؟" href="/login" linkText="تسجيل الدخول" />
    </AuthShell>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetBound, undefined);

  return (
    <AuthShell title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور جديدة لحسابك">
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="token" value={token} />
        <Field
          label="كلمة المرور الجديدة"
          name="password"
          type="password"
          placeholder="٤ أحرف على الأقل"
        />
        {!token ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 14 }}>
            الرابط غير صالح — تأكد من فتحه كاملاً من رسالة إعادة التعيين
          </div>
        ) : null}
        {state?.error ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 14 }}>{state.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={pending || !token}
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
            opacity: pending || !token ? 0.7 : 1,
          }}
        >
          {pending ? "..." : "حفظ كلمة المرور"}
        </button>
      </form>
      <AuthFooter prompt="تذكرت كلمة المرور؟" href="/login" linkText="تسجيل الدخول" />
    </AuthShell>
  );
}
