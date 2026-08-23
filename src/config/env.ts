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
  const apiUrl = getTrimmedEnv("NEXT_PUBLIC_API_URL", "API_URL");
  const cybersoftToken = getTrimmedEnv("NEXT_PUBLIC_CYBERSOFT_TOKEN", "TOKEN");

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
    missing.push("NEXT_PUBLIC_API_URL hoặc API_URL");
  }

  if (!cybersoftToken) {
    missing.push("NEXT_PUBLIC_CYBERSOFT_TOKEN hoặc TOKEN");
  }

  return missing;
}
