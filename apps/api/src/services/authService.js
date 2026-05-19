import { prisma } from "../config/prisma.js";
import { isSupabaseAdminUser } from "../config/auth.js";
import { requestPasswordRecovery, signInWithPassword, updateSupabasePassword } from "./supabaseAuthService.js";
import { AppError } from "../utils/AppError.js";
import { validateStrongPassword } from "../utils/password.js";

export async function loginFuncionario({ email, senha }) {
  if (!email || !senha) {
    throw new AppError("E-mail e senha sao obrigatorios.", 400);
  }

  const session = await signInWithPassword(email, senha);
  const funcionario = await prisma.funcionario.findFirst({
    where: {
      email,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      cargo: true,
    },
  });

  if (!funcionario && isSupabaseAdminUser(session.user?.id)) {
    return {
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      usuario: {
        id: null,
        nome: session.user.email,
        email: session.user.email,
        role: "PROPRIETARIO",
        cargo: "Administrador",
        supabaseUserId: session.user.id,
      },
    };
  }

  if (!funcionario) {
    throw new AppError("Funcionario autenticado nao encontrado no sistema.", 401);
  }

  return {
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    usuario: {
      ...funcionario,
      role: isSupabaseAdminUser(session.user?.id) ? "PROPRIETARIO" : funcionario.role,
      supabaseUserId: session.user?.id,
    },
  };
}

export async function solicitarRedefinicaoSenha({ email, redirectTo }) {
  if (!email) {
    throw new AppError("E-mail e obrigatorio.", 400);
  }

  await requestPasswordRecovery(email, redirectTo);

  return {
    message: "Se o e-mail existir no Supabase Auth, as instrucoes de redefinicao serao enviadas.",
  };
}

export async function atualizarSenhaUsuario({ token, senha }) {
  if (!token || !senha) {
    throw new AppError("Token e nova senha sao obrigatorios.", 400);
  }

  validateStrongPassword(senha, "nova senha");

  await updateSupabasePassword(token, senha);

  return {
    message: "Senha atualizada com sucesso.",
  };
}
