import { getDb } from "@studepartment/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

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
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
