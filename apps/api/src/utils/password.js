import { AppError } from "./AppError.js";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

export function validateStrongPassword(password, fieldName = "senha") {
  if (typeof password !== "string" || !STRONG_PASSWORD_REGEX.test(password)) {
    throw new AppError(
      `O campo ${fieldName} deve ter pelo menos 10 caracteres, com maiuscula, minuscula, numero e caractere especial.`,
      400,
    );
  }
}
