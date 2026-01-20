/**
 * Exemple de Use Case : CreateUser
 *
 * Les Use Cases :
 * - Orchestrent les opérations du domaine
 * - Contiennent la logique applicative
 * - Utilisent des DTOs pour les entrées/sorties
 * - Retournent des Results (pas d'exceptions)
 */

import { z } from 'zod';
import { User } from './domain-entity';
import { Email } from './value-object';
import { UserRepository } from './repository-interface';
import { Result, ok, err } from './result-type';

// ============================================================================
// Schéma de Validation (Zod)
// ============================================================================

export const CreateUserInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string().email("Format d'email invalide").toLowerCase().trim(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

// ============================================================================
// Types de Sortie
// ============================================================================

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

// ============================================================================
// Types d'Erreur
// ============================================================================

export type CreateUserError =
  | { type: 'VALIDATION_ERROR'; message: string; issues: z.ZodIssue[] }
  | { type: 'INVALID_EMAIL'; email: string; reason: string }
  | { type: 'EMAIL_ALREADY_EXISTS'; email: string }
  | { type: 'REPOSITORY_ERROR'; message: string; cause?: Error };

// ============================================================================
// Use Case
// ============================================================================

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Exécute le use case de création d'utilisateur
   *
   * @param rawInput - Données brutes (non validées) de l'entrée
   * @returns Result avec l'utilisateur créé ou une erreur typée
   */
  async execute(
    rawInput: unknown
  ): Promise<Result<CreateUserOutput, CreateUserError>> {
    // ========================================================================
    // Étape 1: Validation de l'entrée avec Zod
    // ========================================================================
    const parseResult = CreateUserInputSchema.safeParse(rawInput);

    if (!parseResult.success) {
      return err({
        type: 'VALIDATION_ERROR',
        message: parseResult.error.issues.map((i) => i.message).join(', '),
        issues: parseResult.error.issues,
      });
    }

    const input = parseResult.data;

    // ========================================================================
    // Étape 2: Création du Value Object Email
    // ========================================================================
    const emailResult = Email.create(input.email);

    if (!emailResult.success) {
      return err({
        type: 'INVALID_EMAIL',
        email: input.email,
        reason: emailResult.error.message,
      });
    }

    const email = emailResult.data;

    // ========================================================================
    // Étape 3: Vérification des règles métier
    // ========================================================================
    try {
      const emailExists = await this.userRepository.existsByEmail(email.value);

      if (emailExists) {
        return err({
          type: 'EMAIL_ALREADY_EXISTS',
          email: input.email,
        });
      }
    } catch (error) {
      return err({
        type: 'REPOSITORY_ERROR',
        message: "Erreur lors de la vérification de l'email",
        cause: error instanceof Error ? error : undefined,
      });
    }

    // ========================================================================
    // Étape 4: Création de l'entité
    // ========================================================================
    const user = new User(
      this.generateId(),
      input.name,
      email,
      'user', // rôle par défaut
      'active', // statut par défaut
      new Date()
    );

    // ========================================================================
    // Étape 5: Persistence
    // ========================================================================
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return err({
        type: 'REPOSITORY_ERROR',
        message: "Erreur lors de la sauvegarde de l'utilisateur",
        cause: error instanceof Error ? error : undefined,
      });
    }

    // ========================================================================
    // Étape 6: Retour du DTO de sortie
    // ========================================================================
    return ok({
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    });
  }

  /**
   * Génère un ID unique pour l'utilisateur
   */
  private generateId(): string {
    return crypto.randomUUID();
  }
}

// ============================================================================
// Exemple d'un autre Use Case : UpdateUser
// ============================================================================

export const UpdateUserInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  email: z
    .string()
    .email("Format d'email invalide")
    .toLowerCase()
    .trim()
    .optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export type UpdateUserError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'USER_NOT_FOUND'; userId: string }
  | { type: 'INVALID_EMAIL'; email: string; reason: string }
  | { type: 'EMAIL_ALREADY_EXISTS'; email: string }
  | { type: 'NAME_CHANGE_ERROR'; message: string }
  | { type: 'REPOSITORY_ERROR'; message: string };

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userId: string,
    rawInput: unknown
  ): Promise<Result<CreateUserOutput, UpdateUserError>> {
    // Validation
    const parseResult = UpdateUserInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return err({
        type: 'VALIDATION_ERROR',
        message: parseResult.error.issues.map((i) => i.message).join(', '),
      });
    }

    const input = parseResult.data;

    // Récupérer l'utilisateur existant
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      return err({
        type: 'USER_NOT_FOUND',
        userId,
      });
    }

    // Mettre à jour le nom si fourni
    if (input.name !== undefined) {
      const nameResult = existingUser.changeName(input.name);
      if (!nameResult.success) {
        return err({
          type: 'NAME_CHANGE_ERROR',
          message: `Erreur lors du changement de nom: ${nameResult.error.type}`,
        });
      }
    }

    // Mettre à jour l'email si fourni
    if (input.email !== undefined) {
      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const emailOwner = await this.userRepository.findByEmail(input.email);
      if (emailOwner && emailOwner.id !== userId) {
        return err({
          type: 'EMAIL_ALREADY_EXISTS',
          email: input.email,
        });
      }

      const emailResult = Email.create(input.email);
      if (!emailResult.success) {
        return err({
          type: 'INVALID_EMAIL',
          email: input.email,
          reason: emailResult.error.message,
        });
      }

      existingUser.changeEmail(emailResult.data);
    }

    // Sauvegarder
    await this.userRepository.save(existingUser);

    return ok({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email.value,
      role: existingUser.role,
      status: existingUser.status,
      createdAt: existingUser.createdAt,
    });
  }
}

// ============================================================================
// Exemple d'un Use Case de Lecture : GetUserById
// ============================================================================

export type GetUserError =
  | { type: 'INVALID_ID'; message: string }
  | { type: 'USER_NOT_FOUND'; userId: string };

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<Result<CreateUserOutput, GetUserError>> {
    // Validation basique de l'ID
    if (!userId || userId.trim() === '') {
      return err({
        type: 'INVALID_ID',
        message: "L'ID utilisateur est requis",
      });
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      return err({
        type: 'USER_NOT_FOUND',
        userId,
      });
    }

    return ok({
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    });
  }
}
