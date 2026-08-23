import type { AuthUser } from "@/types/auth";
import { usersService } from "@/services/users.service";

type SessionLike = {
  token: string;
  user: AuthUser | null;
};

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

export async function resolveSessionUser(session: SessionLike): Promise<AuthUser | null> {
  const { token, user } = session;

  if (!token) {
    return null;
  }

  if (user?.id && user.id > 0) {
    try {
      const resolvedUser = await usersService.getById(user.id, token);
      return {
        ...resolvedUser,
        token,
      };
    } catch {
      // Thử fallback theo email nếu có.
    }
  }

  const userEmail = normalizeText(user?.email);

  if (!userEmail) {
    return user
      ? {
          ...user,
          token,
        }
      : null;
  }

  try {
    const userList = await usersService.getAll(token);
    const matchedUser = userList.find(
      (item) => normalizeText(item.email) === userEmail,
    );

    if (!matchedUser) {
      return user
        ? {
            ...user,
            token,
          }
        : null;
    }

    return {
      ...matchedUser,
      token,
    };
  } catch {
    return user
      ? {
          ...user,
          token,
        }
      : null;
  }
}
