export const FAVORITE_ROOMS_EVENT = "stayora-favorite-rooms-change";

const FAVORITE_ROOMS_KEY_PREFIX = "stayora-favorite-rooms";

function isBrowser() {
  return typeof window !== "undefined";
}

function dispatchFavoriteRoomsChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(FAVORITE_ROOMS_EVENT));
}

function getStorageKey(userId?: number) {
  const safeUserId = typeof userId === "number" && userId > 0 ? String(userId) : "guest";
  return `${FAVORITE_ROOMS_KEY_PREFIX}:${safeUserId}`;
}

function normalizeRoomIds(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  const ids = values
    .map((value) => (typeof value === "number" ? value : Number(value)))
    .filter((value) => Number.isInteger(value) && value > 0);

  return Array.from(new Set(ids));
}

export function getFavoriteRoomIds(userId?: number) {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    return normalizeRoomIds(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(getStorageKey(userId));
    return [];
  }
}

function setFavoriteRoomIds(nextIds: number[], userId?: number) {
  if (!isBrowser()) {
    return;
  }

  const normalized = normalizeRoomIds(nextIds);
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized));
  dispatchFavoriteRoomsChange();
}

export function isFavoriteRoom(roomId: number, userId?: number) {
  return getFavoriteRoomIds(userId).includes(roomId);
}

export function toggleFavoriteRoom(roomId: number, userId?: number) {
  const current = getFavoriteRoomIds(userId);
  const hasRoom = current.includes(roomId);
  const next = hasRoom ? current.filter((value) => value !== roomId) : [...current, roomId];

  setFavoriteRoomIds(next, userId);

  return {
    isFavorite: !hasRoom,
    ids: next,
  };
}

export function setRoomFavoriteState(roomId: number, isFavorite: boolean, userId?: number) {
  const current = getFavoriteRoomIds(userId);
  const next = isFavorite
    ? current.includes(roomId)
      ? current
      : [...current, roomId]
    : current.filter((value) => value !== roomId);

  setFavoriteRoomIds(next, userId);

  return {
    isFavorite,
    ids: next,
  };
}

export function clearFavoriteRooms(userId?: number) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(userId));
  dispatchFavoriteRoomsChange();
}

export function migrateGuestFavoritesToUser(userId: number) {
  if (!isBrowser()) {
    return false;
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return false;
  }

  const guestIds = getFavoriteRoomIds(undefined);
  if (guestIds.length === 0) {
    return false;
  }

  const userIds = getFavoriteRoomIds(userId);
  const merged = Array.from(new Set([...userIds, ...guestIds]));
  setFavoriteRoomIds(merged, userId);
  clearFavoriteRooms(undefined);

  return true;
}
