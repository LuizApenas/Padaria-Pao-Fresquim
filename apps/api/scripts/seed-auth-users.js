import "dotenv/config";

import { prisma } from "../src/config/prisma.js";
import { createSupabaseUser } from "../src/services/supabaseAuthService.js";
import { validateStrongPassword } from "../src/utils/password.js";

const defaultPassword = process.env.SUPABASE_AUTH_SEED_PASSWORD;

async function main() {
  if (!defaultPassword) {
    throw new Error("SUPABASE_AUTH_SEED_PASSWORD precisa estar definido no .env local para criar usuarios Auth.");
  }

  validateStrongPassword(defaultPassword, "SUPABASE_AUTH_SEED_PASSWORD");

  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    select: {
      nome: true,
      email: true,
      role: true,
      cargo: true,
    },
  });

  for (const funcionario of funcionarios) {
    try {
      await createSupabaseUser({
        email: funcionario.email,
        password: defaultPassword,
        metadata: {
          nome: funcionario.nome,
          role: funcionario.role,
          cargo: funcionario.cargo,
        },
      });
      console.log(`Usuario Auth criado: ${funcionario.email}`);
    } catch (error) {
      const message = error?.message ?? "";

      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
        console.log(`Usuario Auth ja existe: ${funcionario.email}`);
        continue;
      }

      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
