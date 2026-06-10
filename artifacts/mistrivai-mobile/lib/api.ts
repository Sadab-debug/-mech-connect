import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SESSION_KEY = "mv_session_cookie";
let _cachedCookie: string | null = undefined as unknown as string | null;

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/flask`;
  return "/flask";
}

async function getSessionCookie(): Promise<string | null> {
  if (_cachedCookie !== undefined) return _cachedCookie;
  _cachedCookie = await AsyncStorage.getItem(SESSION_KEY);
  return _cachedCookie;
}

async function captureSessionCookie(headers: Headers) {
  try {
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/session=[^;]+/);
      if (match) {
        _cachedCookie = match[0];
        await AsyncStorage.setItem(SESSION_KEY, _cachedCookie);
      }
    }
  } catch {}
}

export async function clearSessionCookie() {
  _cachedCookie = null;
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${getApiBase()}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (Platform.OS !== "web") {
    const cookie = await getSessionCookie();
    if (cookie) headers["Cookie"] = cookie;
  }

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  await captureSessionCookie(res.headers);
  return res;
}

export async function apiGet(path: string): Promise<Response> {
  return apiFetch(path, { method: "GET" });
}

export async function apiPost(
  path: string,
  data?: unknown
): Promise<Response> {
  return apiFetch(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
}
