import { ApiException, type ApiResponse } from "./response";

export { useAuthStore, type AccountSnapshot } from "./auth-store";
export { withApi, type ApiContext } from "./with-api";
export {
  ApiException,
  apiFailure,
  apiSuccess,
  formatZodError,
  type ApiErrorBody,
  type ApiFailure,
  type ApiResponse,
  type ApiSuccess,
} from "./response";

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { onSessionExpired?: () => void },
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    if (json.error.code === "SESSION_EXPIRED") {
      init?.onSessionExpired?.();
    }

    throw new ApiException(
      response.status,
      json.error.code,
      json.error.message,
      json.error.details,
    );
  }

  return json.data;
}
