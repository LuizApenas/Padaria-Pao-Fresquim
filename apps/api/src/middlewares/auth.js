import { prisma } from "../config/prisma.js";
import { isSupabaseAdminUser } from "../config/auth.js";
import { getSupabaseUser } from "../services/supabaseAuthService.js";
import { AppError } from "../utils/AppError.js";

function getBearerToken(request) {
  const header = request.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Token de autenticacao ausente.", 401);
  }

  return token;
}

export async function ensureAuth(request, _response, next) {
  try {
    const token = getBearerToken(request);
    const supabaseUser = await getSupabaseUser(token);
    const funcionario = await prisma.funcionario.findFirst({
      where: {
        email: supabaseUser.email,
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

    if (!funcionario && isSupabaseAdminUser(supabaseUser.id)) {
      request.user = {
        id: null,
        nome: supabaseUser.email,
        email: supabaseUser.email,
        role: "PROPRIETARIO",
        cargo: "Administrador",
        supabaseUserId: supabaseUser.id,
      };
      return next();
    }

    if (!funcionario) {
      throw new AppError("Funcionario autenticado nao encontrado no sistema.", 401);
    }

    request.user = {
      ...funcionario,
      role: isSupabaseAdminUser(supabaseUser.id) ? "PROPRIETARIO" : funcionario.role,
      supabaseUserId: supabaseUser.id,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function ensureRole(...roles) {
  return (request, _response, next) => {
    if (!request.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    if (!roles.includes(request.user.role)) {
      return next(new AppError("Usuario sem permissao para esta operacao.", 403));
    }

    return next();
  };
}

export function ensureFuncionarioLinked(request, _response, next) {
  if (!request.user?.id) {
    return next(new AppError("Usuario autenticado sem funcionario vinculado para esta operacao.", 403));
  }

  return next();
}
