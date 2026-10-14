import { getCurrentUser } from "./current-user";

export type ShellViewer = {
  signedIn: boolean;
  accountKind: "individual" | "institution";
};

/**
 * Who is looking at a public workspace page. Visitors see Sign in / Join in
 * the shell instead of Sign out and an identity avatar. A session lookup
 * failure falls back to the visitor view rather than breaking the page.
 */
export async function getShellViewer(): Promise<ShellViewer> {
  try {
    const user = await getCurrentUser();
    return {
      signedIn: Boolean(user),
      accountKind: user?.accountKind === "INSTITUTION" ? "institution" : "individual",
    };
  } catch {
    return { signedIn: false, accountKind: "individual" };
  }
}
