import { getDb } from "@studepartment/db";
import { headers } from "next/headers";
import { auth } from "./auth";

export type AccountRole =
  | "STUDENT"
  | "RESEARCHER"
  | "PROFESSOR"
  | "LAB_ADMIN"
  | "INSTITUTION_ADMIN";

export type AccountKind = "INDIVIDUAL" | "INSTITUTION";

export type CurrentUser = {
  id: string;
  role: AccountRole;
  accountKind: AccountKind;
};

export interface SessionProvider {
  getCurrentUser(): Promise<CurrentUser | null>;
}

export class AuthenticationRequiredError extends Error {
  readonly code = "AUTHENTICATION_REQUIRED";

  constructor() {
    super("Authentication required.");
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Production session provider backed by Better Auth.
 *
 * Session identity is resolved to the canonical User row before product code
 * receives a CurrentUser. This prevents client supplied researcher/profile ids
 * from becoming an authorization primitive.
 */
export const betterAuthSessionProvider: SessionProvider = {
  async getCurrentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;

    const user = await getDb().user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, accountKind: true },
    });

    if (!user) return null;
    return { id: user.id, role: user.role, accountKind: user.accountKind };
  },
};

export async function getCurrentUser(
  provider: SessionProvider = betterAuthSessionProvider,
): Promise<CurrentUser | null> {
  return provider.getCurrentUser();
}

export async function requireCurrentUser(
  provider: SessionProvider = betterAuthSessionProvider,
): Promise<CurrentUser> {
  const user = await provider.getCurrentUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}
