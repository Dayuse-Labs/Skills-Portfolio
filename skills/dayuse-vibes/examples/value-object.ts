/**
 * Exemple de Value Object : Email
 *
 * Un Value Object :
 * - N'a pas d'identité (deux emails avec la même valeur sont égaux)
 * - Est immuable (une fois créé, ne change jamais)
 * - Encapsule la validation
 */

import { Result, ok, err } from './result-type';

// ============================================================================
// Type d'Erreur
// ============================================================================

export interface EmailValidationError {
  type: 'EMAIL_VALIDATION_ERROR';
  message: string;
  value: string;
}

// ============================================================================
// Value Object Email
// ============================================================================

export class Email {
  /**
   * Constructeur privé - force l'utilisation de create()
   */
  private constructor(public readonly value: string) {}

  /**
   * Factory method avec validation
   *
   * @example
   * const result = Email.create('user@example.com');
   * if (result.success) {
   *   console.log(result.data.value); // 'user@example.com'
   * }
   */
  static create(email: string): Result<Email, EmailValidationError> {
    const normalized = email.toLowerCase().trim();

    // Validation : non vide
    if (!normalized) {
      return err({
        type: 'EMAIL_VALIDATION_ERROR',
        message: "L'email ne peut pas être vide",
        value: email,
      });
    }

    // Validation : contient @
    if (!normalized.includes('@')) {
      return err({
        type: 'EMAIL_VALIDATION_ERROR',
        message: "L'email doit contenir @",
        value: email,
      });
    }

    // Validation : format local@domain
    const parts = normalized.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return err({
        type: 'EMAIL_VALIDATION_ERROR',
        message: "L'email doit avoir un format local@domain",
        value: email,
      });
    }

    // Validation : domaine contient un point
    if (!parts[1].includes('.')) {
      return err({
        type: 'EMAIL_VALIDATION_ERROR',
        message: 'Le domaine doit contenir un point',
        value: email,
      });
    }

    return ok(new Email(normalized));
  }

  /**
   * Comparaison par valeur (pas par référence)
   *
   * @example
   * const email1 = Email.create('user@example.com');
   * const email2 = Email.create('USER@EXAMPLE.COM');
   * email1.data.equals(email2.data); // true
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Extrait le domaine de l'email
   *
   * @example
   * const email = Email.create('user@example.com');
   * email.data.domain; // 'example.com'
   */
  get domain(): string {
    const parts = this.value.split('@');
    return parts[1] ?? '';
  }

  /**
   * Extrait la partie locale de l'email
   *
   * @example
   * const email = Email.create('user@example.com');
   * email.data.localPart; // 'user'
   */
  get localPart(): string {
    const parts = this.value.split('@');
    return parts[0] ?? '';
  }

  /**
   * Représentation en string
   */
  toString(): string {
    return this.value;
  }
}

// ============================================================================
// Autre Exemple : Money
// ============================================================================

export interface MoneyValidationError {
  type: 'MONEY_VALIDATION_ERROR';
  message: string;
}

/**
 * Value Object pour les montants monétaires
 * Évite les erreurs de calcul en virgule flottante
 */
export class Money {
  /**
   * Stocke en centimes pour éviter les problèmes de float
   */
  private constructor(
    private readonly cents: number,
    public readonly currency: string
  ) {}

  /**
   * Crée un Money à partir d'un montant en unité (euros, dollars, etc.)
   *
   * @example
   * const price = Money.fromAmount(19.99, 'EUR');
   */
  static fromAmount(
    amount: number,
    currency: string
  ): Result<Money, MoneyValidationError> {
    if (amount < 0) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'Le montant ne peut pas être négatif',
      });
    }

    if (!currency || currency.length !== 3) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'La devise doit être un code ISO 4217 (3 lettres)',
      });
    }

    // Convertit en centimes et arrondit pour éviter les erreurs de float
    const cents = Math.round(amount * 100);
    return ok(new Money(cents, currency.toUpperCase()));
  }

  /**
   * Crée un Money à partir de centimes
   */
  static fromCents(
    cents: number,
    currency: string
  ): Result<Money, MoneyValidationError> {
    if (cents < 0) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'Le montant ne peut pas être négatif',
      });
    }

    if (!Number.isInteger(cents)) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'Les centimes doivent être un entier',
      });
    }

    return ok(new Money(cents, currency.toUpperCase()));
  }

  /**
   * Retourne le montant en unité (avec 2 décimales)
   */
  get amount(): number {
    return this.cents / 100;
  }

  /**
   * Retourne le montant en centimes
   */
  get inCents(): number {
    return this.cents;
  }

  /**
   * Additionne deux Money (doit être même devise)
   */
  add(other: Money): Result<Money, MoneyValidationError> {
    if (this.currency !== other.currency) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: `Impossible d'additionner ${this.currency} et ${other.currency}`,
      });
    }

    return Money.fromCents(this.cents + other.cents, this.currency);
  }

  /**
   * Soustrait deux Money (doit être même devise)
   */
  subtract(other: Money): Result<Money, MoneyValidationError> {
    if (this.currency !== other.currency) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: `Impossible de soustraire ${other.currency} de ${this.currency}`,
      });
    }

    if (this.cents < other.cents) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'Le résultat serait négatif',
      });
    }

    return Money.fromCents(this.cents - other.cents, this.currency);
  }

  /**
   * Multiplie par un facteur
   */
  multiply(factor: number): Result<Money, MoneyValidationError> {
    if (factor < 0) {
      return err({
        type: 'MONEY_VALIDATION_ERROR',
        message: 'Le facteur ne peut pas être négatif',
      });
    }

    const newCents = Math.round(this.cents * factor);
    return Money.fromCents(newCents, this.currency);
  }

  /**
   * Comparaison par valeur
   */
  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  /**
   * Comparaison (pour tri)
   */
  compareTo(other: Money): number {
    if (this.currency !== other.currency) {
      throw new Error('Impossible de comparer des devises différentes');
    }
    return this.cents - other.cents;
  }

  /**
   * Formatage pour affichage
   */
  format(locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }
}
