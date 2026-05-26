export const SESSION_COOKIE = "session"
export const SESSION_VALUE = "authenticated-panobianco"
export const VALID_LOGIN = "panobianco"
export const VALID_PASSWORD = "sjcsatelite"

export function validateApiRequest(req: Request): { isValid: boolean; error?: string; status?: number } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isValid: false, error: "Não autorizado.", status: 401 };
  }
  const token = authHeader.substring(7);

  const cronSecret = process.env.CRON_SECRET;
  const integrationToken = process.env.INTEGRATION_TOKEN || "panobiancosatelite";

  if (!cronSecret && !integrationToken) {
    return {
      isValid: false,
      error: "Autenticação da API (CRON_SECRET ou INTEGRATION_TOKEN) não configurada no servidor.",
      status: 500
    };
  }

  const matchesCron = !!(cronSecret && token === cronSecret);
  const matchesIntegration = !!(integrationToken && token === integrationToken);

  if (!matchesCron && !matchesIntegration) {
    return { isValid: false, error: "Token inválido.", status: 401 };
  }

  return { isValid: true };
}
