import { randomUUID, randomBytes } from "node:crypto";

export class GuidGenerator {
  private static readonly ALPHABET =
    "useyourcustomalphabet123456789abcdefghijkmnopqrstuvwxyz";

  /**
   * Genera un ID corto y seguro (por defecto 10 caracteres).
   * Ideal para códigos de seguimiento o URLs cortas en Anami.
   */
  static generateShort(size = 10): string {
    const bytes = randomBytes(size);
    let id = "";

    for (let i = 0; i < size; i++) {
      // Usamos el byte para elegir un caracter del alfabeto
      id += this.ALPHABET[bytes[i] % this.ALPHABET.length];
    }

    return id;
  }

  /**
   * Genera un UUID v4 estándar.
   * @returns string (ej: "550e8400-e29b-41d4-a716-446655440000")
   */
  static generate(): string {
    return randomUUID();
  }

  /**
   * Valida si un string es un UUID válido.
   * Útil para guardias de seguridad o validaciones de entrada.
   */
  static isValid(guid: string): boolean {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(guid);
  }
}
