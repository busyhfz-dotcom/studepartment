import { getDb } from "@studepartment/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getCoreRuntimeConfig } from "@/server/config/environment";
import { after } from "next/server";
import { isEmailDeliveryConfigured, sendEmail } from "@/server/notifications/email";
import { isInstitutionalOrganizationType } from "@/server/validation/organization";

const runtime = getCoreRuntimeConfig();
const trustedOrigin = new URL(runtime.betterAuthUrl).origin;
const emailConfigured = isEmailDeliveryConfigured();

function sendAccountLink(to: string, url: string, action: "reset" | "verify") {
  after(async () => {
    const label = action === "reset" ? "Reset your Provenant password" : "Verify your Provenant email";
    const safeUrl = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const result = await sendEmail({
      to,
      subject: label,
      text: `${label}: ${url}\nIf you did not request this, ignore this email.`,
      html: `<p><a href="${safeUrl}">${label}</a></p><p>If you did not request this, ignore this email.</p>`,
    });
    if (!result.sent) console.error("[auth] account email delivery failed", action, result.reason);
  });
}

/**
 * Authentication provider boundary for the web application.
 *
 * Better Auth owns account/session mechanics. Product code must consume the
 * SessionProvider abstraction in current-user.ts instead of importing this
 * instance directly, which keeps scientific authorization rules independent
 * from the authentication vendor.
 */
export const auth = betterAuth({
  appName: "Provenant",
  database: prismaAdapter(getDb(), {
    provider: "postgresql",
    transaction: true,
  }),
  secret: runtime.betterAuthSecret,
  baseURL: runtime.betterAuthUrl,
  trustedOrigins: [trustedOrigin],
  user: {
    additionalFields: {
      accountKind: { type: "string", required: false, defaultValue: "INDIVIDUAL" },
      organizationTypePreference: { type: "string", required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const institutional = user.accountKind === "INSTITUTION";
          return {
            data: {
              ...user,
              accountKind: institutional ? "INSTITUTION" : "INDIVIDUAL",
              organizationTypePreference: institutional && isInstitutionalOrganizationType(user.organizationTypePreference)
                ? user.organizationTypePreference
                : null,
            },
          };
        },
      },
      update: {
        before: async (user) => !("accountKind" in user || "organizationTypePreference" in user),
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    ...(emailConfigured ? {
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        // Send after responding so account existence cannot be inferred from delivery latency.
        sendAccountLink(user.email, url, "reset");
      },
    } : {}),
  },
  ...(emailConfigured ? {
    emailVerification: {
      sendOnSignUp: false,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        sendAccountLink(user.email, url, "verify");
      },
    },
  } : {}),
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
      "/send-verification-email": { window: 300, max: 5 },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
    ipAddress: {
      ipAddressHeaders: runtime.authIpHeaders,
      ...(runtime.trustedProxies.length ? { trustedProxies: runtime.trustedProxies } : {}),
    },
  },
});
