export const API_BASE_URL =
  "https://holy-bush-2c62.sch2841985.workers.dev";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    localStorage.getItem("token");

  const headers =
    new Headers(options.headers);

  headers.set(
    "Content-Type",
    "application/json"
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );

  if (
    response.status === 401 &&
    path !== "/api/auth/login"
  ) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href =
      "/login";

    throw new Error(
      "انتهت جلسة تسجيل الدخول"
    );
  }

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      "Request failed"
    );
  }

  return data as T;
}
