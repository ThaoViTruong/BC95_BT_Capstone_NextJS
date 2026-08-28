import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";

export async function getAdminSession() {
  const session = await getAuthSession();

  if (!session?.token || session.roleKey !== "admin") {
    return null;
  }

  const user = await resolveSessionUser({
    token: session.token,
    user: session.user,
  });

  if (!user || user.role?.trim().toUpperCase() !== "ADMIN") {
    return null;
  }

  return {
    token: session.token,
    user,
  };
}
