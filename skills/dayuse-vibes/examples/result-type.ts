/**
 * Implémentation du type Result
 *
 * Le pattern Result permet de gérer les erreurs de manière explicite
 * sans utiliser throw/catch pour les erreurs métier.
 */

// ============================================================================
// Types de Base
// ============================================================================

/**
 * Type Result générique
 * T = type de la valeur en cas de succès
 * E = type de l'erreur en cas d'échec
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// ============================================================================
// Constructeurs
// ============================================================================

/**
 * Crée un résultat réussi
 *
 * @example
 * const result = ok(42);
 * // result.success === true
 * // result.data === 42
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Crée un résultat en erreur
 *
 * @example
 * const result = err({ type: 'NOT_FOUND', id: '123' });
 * // result.success === false
 * // result.error.type === 'NOT_FOUND'
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Vérifie si un résultat est un succès
 */
export function isOk<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Vérifie si un résultat est une erreur
 */
export function isErr<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return !result.success;
}

// ============================================================================
// Transformations
// ============================================================================

/**
 * Transforme la valeur d'un Result réussi
 *
 * @example
 * const numResult = ok(42);
 * const strResult = map(numResult, n => n.toString());
 * // strResult.data === '42'
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Transforme l'erreur d'un Result échoué
 *
 * @example
 * const result = err('not found');
 * const mapped = mapError(result, msg => ({ type: 'ERROR', message: msg }));
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chaîne des opérations qui retournent des Results
 *
 * @example
 * const result = flatMap(
 *   parseNumber('42'),
 *   num => divide(100, num)
 * );
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

// ============================================================================
// Utilitaires
// ============================================================================

/**
 * Retourne la valeur ou un défaut si erreur
 *
 * @example
 * const count = getOrDefault(parseNumber(input), 0);
 */
export function getOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Retourne la valeur ou exécute une fonction pour le défaut
 *
 * @example
 * const user = getOrElse(findUser(id), () => createGuestUser());
 */
export function getOrElse<T, E>(
  result: Result<T, E>,
  defaultFn: (error: E) => T
): T {
  return result.success ? result.data : defaultFn(result.error);
}

/**
 * Combine plusieurs Results en un seul
 * Échoue dès qu'un Result échoue
 *
 * @example
 * const results = [ok(1), ok(2), ok(3)];
 * const combined = combine(results);
 * // combined.data === [1, 2, 3]
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.data);
  }

  return ok(values);
}

/**
 * Convertit une Promise en Result
 *
 * @example
 * const result = await fromPromise(
 *   fetch('/api/users'),
 *   (error) => ({ type: 'FETCH_ERROR', cause: error })
 * );
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    if (mapError) {
      return err(mapError(error));
    }
    return err(error as E);
  }
}

/**
 * Exécute une fonction et capture les exceptions en Result
 *
 * @example
 * const result = tryCatch(
 *   () => JSON.parse(jsonString),
 *   (error) => ({ type: 'PARSE_ERROR', cause: error })
 * );
 */
export function tryCatch<T, E>(
  fn: () => T,
  mapError: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(mapError(error));
  }
}

// ============================================================================
// Types d'Erreur Courants
// ============================================================================

/**
 * Erreur de validation générique
 */
export interface ValidationError {
  type: 'VALIDATION_ERROR';
  message: string;
  field?: string;
}

/**
 * Erreur "non trouvé" générique
 */
export interface NotFoundError {
  type: 'NOT_FOUND';
  resource: string;
  id: string;
}

/**
 * Erreur de conflit (ex: doublon)
 */
export interface ConflictError {
  type: 'CONFLICT';
  message: string;
  conflictingValue?: string;
}

/**
 * Erreur technique/infrastructure
 */
export interface InfrastructureError {
  type: 'INFRASTRUCTURE_ERROR';
  message: string;
  cause?: Error;
}
