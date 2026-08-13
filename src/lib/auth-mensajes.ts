const TRADUCCIONES: Array<[RegExp, string]> = [
  [/user already registered|already been registered/i, "Ese correo ya está registrado. Inicia sesión."],
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/should be different from the old password/i, "La nueva contraseña debe ser distinta a la anterior."],
  [/email address .* is invalid|invalid email/i, "El correo no es válido."],
  [/email not confirmed/i, "Debes confirmar tu correo antes de ingresar."],
  [/rate limit|too many requests|for security purposes/i, "Demasiados intentos. Espera un momento e inténtalo de nuevo."],
  [/signups not allowed|signup is disabled/i, "El registro está deshabilitado. Contacta a la coordinación."],
  [/token has expired|invalid.*token/i, "El enlace expiró o no es válido. Solicita uno nuevo."],
  [/network|fetch failed/i, "Problema de conexión. Verifica tu internet."],
];

export function mensajeAuth(mensaje?: string | null) {
  if (!mensaje) return "Ocurrió un error. Inténtalo de nuevo.";
  const encontrado = TRADUCCIONES.find(([patron]) => patron.test(mensaje));
  return encontrado ? encontrado[1] : "No se pudo completar la operación. Inténtalo de nuevo.";
}
