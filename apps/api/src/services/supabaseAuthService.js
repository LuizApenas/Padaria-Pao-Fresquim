import { AppError } from "../utils/AppError.js";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureSupabaseAuthConfig({ admin = false } = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AppError("Autenticacao Supabase nao configurada.", 500);
  }

  if (admin && !supabaseServiceRoleKey) {
    throw new AppError("Chave service role do Supabase nao configurada.", 500);
  }
}

async function parseSupabaseResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AppError(body?.error_description ?? body?.msg ?? body?.message ?? fallbackMessage, response.status);
  }

  return body;
}

export async function signInWithPassword(email, password) {
  ensureSupabaseAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return parseSupabaseResponse(response, "Credenciais invalidas no Supabase Auth.");
}

export async function getSupabaseUser(accessToken) {
  ensureSupabaseAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseSupabaseResponse(response, "Token Supabase invalido.");
}

export async function createSupabaseUser({ email, password, metadata = {} }) {
  ensureSupabaseAuthConfig({ admin: true });

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });

  return parseSupabaseResponse(response, "Nao foi possivel criar usuario no Supabase Auth.");
}

export async function requestPasswordRecovery(email, redirectTo) {
  ensureSupabaseAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      gotrue_meta_security: {},
      ...(redirectTo ? { redirect_to: redirectTo } : {}),
    }),
  });

  return parseSupabaseResponse(response, "Nao foi possivel solicitar redefinicao de senha.");
}

export async function updateSupabasePassword(accessToken, password) {
  ensureSupabaseAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password,
    }),
  });

  return parseSupabaseResponse(response, "Nao foi possivel atualizar a senha.");
}
