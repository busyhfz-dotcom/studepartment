export type AccountRole =
  | "STUDENT"
  | "RESEARCHER"
  | "PROFESSOR"
  | "LAB_ADMIN"
  | "INSTITUTION_ADMIN";

export type CurrentUser = {
  id: string;
  role: AccountRole;
};

export interface SessionProvider {
  getCurrentUser(): Promise<CurrentUser | null>;
}

/**
 * Temporary unauthenticated provider.
 *
 * Product code should depend on SessionProvider / CurrentUser rather than a
 * concrete authentication library. A production session provider can then be
 * introduced without coupling repositories to provider-specific session types.
 */
export const anonymousSessionProvider: SessionProvider = {
  async getCurrentUser() {
    return null;
  },
};

export async function requireCurrentUser(provider: SessionProvider): Promise<CurrentUser> {
  const user = await provider.getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }
  return user;
}
