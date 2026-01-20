/**
 * Exemple d'Entité de Domaine : User
 *
 * Une Entité :
 * - A une identité unique (id) qui la distingue
 * - Peut changer d'état au cours du temps
 * - Contient la logique métier
 * - Utilise des Value Objects pour ses propriétés
 */

import { Result, ok, err } from './result-type';
import { Email } from './value-object';

// ============================================================================
// Types d'Erreur
// ============================================================================

export type UserError =
  | { type: 'NAME_TOO_SHORT'; minLength: number; actualLength: number }
  | { type: 'NAME_TOO_LONG'; maxLength: number; actualLength: number }
  | { type: 'NAME_EMPTY' }
  | { type: 'CANNOT_DEACTIVATE_ADMIN' };

// ============================================================================
// Types Associés
// ============================================================================

export type UserRole = 'admin' | 'user' | 'guest';

export type UserStatus = 'active' | 'inactive' | 'suspended';

// ============================================================================
// Entité User
// ============================================================================

export class User {
  private _name: string;
  private _email: Email;
  private _role: UserRole;
  private _status: UserStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    name: string,
    email: Email,
    role: UserRole = 'user',
    status: UserStatus = 'active',
    createdAt: Date = new Date()
  ) {
    this._name = name;
    this._email = email;
    this._role = role;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = createdAt;
  }

  // ==========================================================================
  // Getters (lecture seule)
  // ==========================================================================

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==========================================================================
  // Propriétés Calculées
  // ==========================================================================

  /**
   * Calcule l'âge du compte en jours
   */
  get accountAgeInDays(): number {
    const now = new Date();
    const diffMs = now.getTime() - this._createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si l'utilisateur est actif
   */
  get isActive(): boolean {
    return this._status === 'active';
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  get isAdmin(): boolean {
    return this._role === 'admin';
  }

  // ==========================================================================
  // Méthodes Métier (avec validation)
  // ==========================================================================

  /**
   * Change le nom de l'utilisateur
   *
   * @example
   * const result = user.changeName('Nouveau Nom');
   * if (!result.success) {
   *   console.error(result.error);
   * }
   */
  changeName(newName: string): Result<void, UserError> {
    const trimmed = newName.trim();

    if (!trimmed) {
      return err({ type: 'NAME_EMPTY' });
    }

    if (trimmed.length < 2) {
      return err({
        type: 'NAME_TOO_SHORT',
        minLength: 2,
        actualLength: trimmed.length,
      });
    }

    if (trimmed.length > 100) {
      return err({
        type: 'NAME_TOO_LONG',
        maxLength: 100,
        actualLength: trimmed.length,
      });
    }

    this._name = trimmed;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * Change l'email de l'utilisateur
   * L'email est déjà validé car c'est un Value Object
   */
  changeEmail(newEmail: Email): void {
    this._email = newEmail;
    this._updatedAt = new Date();
  }

  /**
   * Promeut l'utilisateur en admin
   */
  promoteToAdmin(): void {
    this._role = 'admin';
    this._updatedAt = new Date();
  }

  /**
   * Rétrograde l'utilisateur en utilisateur standard
   */
  demoteToUser(): void {
    this._role = 'user';
    this._updatedAt = new Date();
  }

  /**
   * Active l'utilisateur
   */
  activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  /**
   * Désactive l'utilisateur (interdit pour les admins)
   */
  deactivate(): Result<void, UserError> {
    if (this._role === 'admin') {
      return err({ type: 'CANNOT_DEACTIVATE_ADMIN' });
    }

    this._status = 'inactive';
    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * Suspend l'utilisateur
   */
  suspend(): void {
    this._status = 'suspended';
    this._updatedAt = new Date();
  }

  // ==========================================================================
  // Égalité et Comparaison
  // ==========================================================================

  /**
   * Deux entités sont égales si elles ont le même ID
   * (pas les mêmes valeurs)
   */
  equals(other: User): boolean {
    return this.id === other.id;
  }

  // ==========================================================================
  // Sérialisation
  // ==========================================================================

  /**
   * Convertit en objet simple pour l'API/persistence
   */
  toJSON(): UserSnapshot {
    return {
      id: this.id,
      name: this._name,
      email: this._email.value,
      role: this._role,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// Types pour la Sérialisation
// ============================================================================

/**
 * Snapshot de l'entité User pour persistence/API
 */
export interface UserSnapshot {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Factory pour Reconstruire depuis la Persistence
// ============================================================================

export interface UserReconstructionError {
  type: 'USER_RECONSTRUCTION_ERROR';
  message: string;
  field?: string;
}

/**
 * Reconstruit un User depuis un snapshot (ex: depuis la BDD)
 */
export function reconstructUser(
  snapshot: UserSnapshot
): Result<User, UserReconstructionError> {
  // Recréer le Value Object Email
  const emailResult = Email.create(snapshot.email);
  if (!emailResult.success) {
    return err({
      type: 'USER_RECONSTRUCTION_ERROR',
      message: `Email invalide: ${emailResult.error.message}`,
      field: 'email',
    });
  }

  // Parser les dates
  const createdAt = new Date(snapshot.createdAt);
  if (isNaN(createdAt.getTime())) {
    return err({
      type: 'USER_RECONSTRUCTION_ERROR',
      message: 'Date de création invalide',
      field: 'createdAt',
    });
  }

  // Créer l'entité
  const user = new User(
    snapshot.id,
    snapshot.name,
    emailResult.data,
    snapshot.role,
    snapshot.status,
    createdAt
  );

  return ok(user);
}
