function getTrimmedEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

export function getApiEnv() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    getTrimmedEnv("API_URL");

  const cybersoftToken =
    process.env.NEXT_PUBLIC_CYBERSOFT_TOKEN?.trim() ||
    getTrimmedEnv("TOKEN");

  return {
    apiUrl,
    cybersoftToken,
    isReady: Boolean(apiUrl && cybersoftToken),
  };
}

export function getMissingApiEnv() {
  const { apiUrl, cybersoftToken } = getApiEnv();
  const missing: string[] = [];

  if (!apiUrl) {
    missing.push("NEXT_PUBLIC_API_URL");
  }

  if (!cybersoftToken) {
    missing.push("NEXT_PUBLIC_CYBERSOFT_TOKEN");
  }

  return missing;
}
