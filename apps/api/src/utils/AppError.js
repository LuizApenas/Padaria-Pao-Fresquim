// Classe base para erros de negócio controlados pela aplicação.
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    // Nome explícito para facilitar a identificação do erro em logs e middlewares.
    this.name = "AppError";
    // Status HTTP que deve ser devolvido quando esse erro for lançado.
    this.statusCode = statusCode;

    // Remove frames internos da stack para deixar o rastreio mais limpo.
    Error.captureStackTrace?.(this, AppError);
  }
}
