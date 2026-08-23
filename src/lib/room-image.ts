const FALLBACK_ROOM_IMAGE = "/file.svg";
const DEFAULT_ROOM_IMAGE_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "https://airbnbnew.cybersoft.edu.vn";
const ALLOWED_REMOTE_HOSTS = new Set([
  "airbnbnew.cybersoft.edu.vn",
  "coresg-normal.trae.ai",
  "images.unsplash.com",
  "dogolegia.vn",
  "acihome.vn",
]);

function hasHttpProtocol(value: string) {
  return /^https?:\/\//i.test(value);
}

function hasOtherProtocol(value: string) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
}

function isAllowedRemoteUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" && ALLOWED_REMOTE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getRoomImageSrc(value?: string) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return FALLBACK_ROOM_IMAGE;
  }

  if (rawValue.startsWith("/")) {
    return rawValue;
  }

  if (hasHttpProtocol(rawValue)) {
    return isAllowedRemoteUrl(rawValue) ? rawValue : FALLBACK_ROOM_IMAGE;
  }

  if (hasOtherProtocol(rawValue)) {
    return FALLBACK_ROOM_IMAGE;
  }

  const normalizedPath = rawValue.replace(/^\.?\//, "");
  const imagePath = normalizedPath.startsWith("images/")
    ? normalizedPath
    : `images/${normalizedPath}`;

  try {
    const imageUrl = new URL(imagePath, `${DEFAULT_ROOM_IMAGE_ORIGIN}/`).toString();

    return isAllowedRemoteUrl(imageUrl) ? imageUrl : FALLBACK_ROOM_IMAGE;
  } catch {
    return FALLBACK_ROOM_IMAGE;
  }
}
