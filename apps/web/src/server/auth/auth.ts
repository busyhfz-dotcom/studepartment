import { getDb } from "@studepartment/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getCoreRuntimeConfig } from "@/server/config/environment";
import { after } from "next/server";
import { isEmailDeliveryConfigured, sendEmail } from "@/server/notifications/email";

const runtime = getCoreRuntimeConfig();
const trustedOrigin = new URL(runtime.betterAuthUrl).origin;

/**
 * Authentication provider boundary for the web application.
 *
 * Better Auth owns account/session mechanics. Product code must consume the
 * SessionProvider abstraction in current-user.ts instead of importing this
 * instance directly, which keeps scientific authorization rules independent
 * from the authentication vendor.
 */
export const auth = betterAuth({
  appName: "Studepartment",
  database: prismaAdapter(getDb(), {
    provider: "postgresql",
    transaction: true,
  }),
  secret: runtime.betterAuthSecret,
  baseURL: runtime.betterAuthUrl,
  trustedOrigins: [trustedOrigin],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    ...(isEmailDeliveryConfigured() ? {
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        // Send after responding so account existence cannot be inferred from delivery latency.
        after(async () => {
          const safeUrl = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
          const result = await sendEmail({ to: user.email, subject: "Reset your Studepartment password", text: `Reset your password: ${url}\nIf you did not request this, ignore this email.`, html: `<p><a href="${safeUrl}">Reset your password</a></p><p>If you did not request this, ignore this email.</p>` });
          if (!result.sent) console.error("[auth] password reset email delivery failed", result.reason);
        });
      },
    } : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 120,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 300, max: 5 },
      "/forget-password": { window: 300, max: 5 },
      "/request-password-reset": { window: 300, max: 5 },
      "/reset-password": { window: 300, max: 8 },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
    ipAddress: {
      ipAddressHeaders: [runtime.authIpHeader],
      ...(runtime.trustedProxies.length ? { trustedProxies: runtime.trustedProxies } : {}),
    },
  },
});
