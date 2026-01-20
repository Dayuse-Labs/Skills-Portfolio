/**
 * Exemple de Schémas Zod
 *
 * Les schémas Zod servent à :
 * - Valider les données entrantes (API, formulaires)
 * - Générer automatiquement les types TypeScript
 * - Documenter les formats attendus
 */

import { z } from 'zod';

// ============================================================================
// Schémas de Base Réutilisables
// ============================================================================

/**
 * Email normalisé et validé
 */
export const EmailSchema = z
  .string()
  .email("Format d'email invalide")
  .toLowerCase()
  .trim();

/**
 * Nom avec contraintes
 */
export const NameSchema = z
  .string()
  .min(2, 'Le nom doit faire au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .trim();

/**
 * UUID
 */
export const UuidSchema = z.string().uuid('ID invalide');

/**
 * Mot de passe sécurisé
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Le mot de passe doit faire au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

/**
 * Rôle utilisateur
 */
export const RoleSchema = z.enum(['admin', 'user', 'guest']);

/**
 * Statut utilisateur
 */
export const StatusSchema = z.enum(['active', 'inactive', 'suspended']);

// ============================================================================
// DTOs de Création
// ============================================================================

/**
 * Schéma pour créer un utilisateur
 */
export const CreateUserSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  role: RoleSchema.optional().default('user'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Schéma pour créer un utilisateur avec confirmation de mot de passe
 */
export const CreateUserWithConfirmSchema = CreateUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type CreateUserWithConfirmInput = z.infer<
  typeof CreateUserWithConfirmSchema
>;

// ============================================================================
// DTOs de Mise à Jour
// ============================================================================

/**
 * Schéma pour mettre à jour un utilisateur (tous les champs optionnels)
 */
export const UpdateUserSchema = z.object({
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * Schéma pour changer le mot de passe
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Le nouveau mot de passe doit être différent',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ============================================================================
// DTOs de Requête (Query Parameters)
// ============================================================================

/**
 * Schéma de pagination standard
 * Note: coerce convertit les strings en nombres (utile pour query params)
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Schéma de tri
 */
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SortInput = z.infer<typeof SortSchema>;

/**
 * Schéma de recherche utilisateurs
 */
export const SearchUsersSchema = PaginationSchema.merge(SortSchema).extend({
  q: z.string().optional(),
  role: RoleSchema.optional(),
  status: StatusSchema.optional(),
});

export type SearchUsersInput = z.infer<typeof SearchUsersSchema>;

// ============================================================================
// DTOs de Réponse
// ============================================================================

/**
 * Schéma de réponse utilisateur (sans mot de passe)
 */
export const UserResponseSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  status: StatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * Schéma de réponse paginée
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  });
}

export const PaginatedUsersResponseSchema =
  createPaginatedResponseSchema(UserResponseSchema);

export type PaginatedUsersResponse = z.infer<
  typeof PaginatedUsersResponseSchema
>;

// ============================================================================
// Schémas pour les Webhooks/Events
// ============================================================================

/**
 * Base pour tous les événements
 */
const EventBaseSchema = z.object({
  eventId: UuidSchema,
  timestamp: z.string().datetime(),
  version: z.literal(1),
});

/**
 * Événement: Utilisateur créé
 */
export const UserCreatedEventSchema = EventBaseSchema.extend({
  type: z.literal('user.created'),
  payload: z.object({
    userId: UuidSchema,
    email: EmailSchema,
    name: NameSchema,
  }),
});

/**
 * Événement: Utilisateur mis à jour
 */
export const UserUpdatedEventSchema = EventBaseSchema.extend({
  type: z.literal('user.updated'),
  payload: z.object({
    userId: UuidSchema,
    changes: z.record(z.unknown()),
  }),
});

/**
 * Événement: Utilisateur supprimé
 */
export const UserDeletedEventSchema = EventBaseSchema.extend({
  type: z.literal('user.deleted'),
  payload: z.object({
    userId: UuidSchema,
  }),
});

/**
 * Union de tous les événements utilisateur
 */
export const UserEventSchema = z.discriminatedUnion('type', [
  UserCreatedEventSchema,
  UserUpdatedEventSchema,
  UserDeletedEventSchema,
]);

export type UserEvent = z.infer<typeof UserEventSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

import { Result, ok, err } from './result-type';

export interface ZodValidationError {
  type: 'VALIDATION_ERROR';
  message: string;
  issues: z.ZodIssue[];
}

/**
 * Valide des données avec un schéma Zod et retourne un Result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ZodValidationError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  return err({
    type: 'VALIDATION_ERROR',
    message: result.error.issues.map((i) => i.message).join(', '),
    issues: result.error.issues,
  });
}

/**
 * Valide des données de manière asynchrone
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<Result<T, ZodValidationError>> {
  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return ok(result.data);
  }

  return err({
    type: 'VALIDATION_ERROR',
    message: result.error.issues.map((i) => i.message).join(', '),
    issues: result.error.issues,
  });
}
