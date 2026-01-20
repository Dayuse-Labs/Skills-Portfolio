/**
 * Exemple d'Interface Repository
 *
 * Les Repositories :
 * - Définissent COMMENT accéder aux données (le contrat)
 * - Vivent dans la couche domain
 * - Sont implémentés dans la couche infrastructure
 */

import { User } from './domain-entity';

// ============================================================================
// Interface Repository de Base
// ============================================================================

/**
 * Interface repository pour l'agrégat User
 * Les détails d'implémentation (BDD, API) ne sont PAS spécifiés ici
 */
export interface UserRepository {
  /**
   * Trouve un utilisateur par son identifiant unique
   * @returns User si trouvé, null sinon
   */
  findById(id: string): Promise<User | null>;

  /**
   * Trouve un utilisateur par son adresse email
   * @returns User si trouvé, null sinon
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persiste un utilisateur (création ou mise à jour)
   */
  save(user: User): Promise<void>;

  /**
   * Supprime un utilisateur du système
   */
  delete(id: string): Promise<void>;

  /**
   * Vérifie si un utilisateur existe avec l'email donné
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Vérifie si un utilisateur existe avec l'ID donné
   */
  existsById(id: string): Promise<boolean>;
}

// ============================================================================
// Types pour la Pagination
// ============================================================================

/**
 * Résultat paginé générique
 */
export interface PaginatedResult<T> {
  /** Les éléments de la page courante */
  data: T[];
  /** Nombre total d'éléments */
  total: number;
  /** Numéro de la page courante (commence à 1) */
  page: number;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Y a-t-il une page suivante ? */
  hasNextPage: boolean;
  /** Y a-t-il une page précédente ? */
  hasPreviousPage: boolean;
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Options de tri
 */
export interface SortOptions<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}

// ============================================================================
// Interface Repository Étendue avec Requêtes
// ============================================================================

/**
 * Repository étendu avec des méthodes de requête
 */
export interface UserQueryRepository extends UserRepository {
  /**
   * Trouve tous les utilisateurs avec pagination
   */
  findAll(options: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Recherche des utilisateurs par nom
   */
  searchByName(
    query: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>>;

  /**
   * Trouve les utilisateurs par rôle
   */
  findByRole(
    role: 'admin' | 'user' | 'guest',
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>>;

  /**
   * Trouve les utilisateurs par statut
   */
  findByStatus(
    status: 'active' | 'inactive' | 'suspended',
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>>;

  /**
   * Compte le nombre total d'utilisateurs
   */
  count(): Promise<number>;

  /**
   * Compte les utilisateurs par statut
   */
  countByStatus(status: 'active' | 'inactive' | 'suspended'): Promise<number>;
}

// ============================================================================
// Exemple d'Interface pour un Autre Agrégat
// ============================================================================

/**
 * Interface pour un produit (exemple)
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Repository pour les produits
 */
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;

  /** Recherche par catégorie */
  findByCategory(
    categoryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /** Recherche par plage de prix */
  findByPriceRange(
    minPrice: number,
    maxPrice: number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /** Produits en stock */
  findInStock(options?: PaginationOptions): Promise<PaginatedResult<Product>>;

  /** Mise à jour du stock */
  updateStock(id: string, quantity: number): Promise<void>;
}

// ============================================================================
// Interface de Transaction (Optionnel)
// ============================================================================

/**
 * Interface pour gérer les transactions
 * Utile quand plusieurs opérations doivent être atomiques
 */
export interface TransactionManager {
  /**
   * Exécute une fonction dans une transaction
   * Rollback automatique en cas d'erreur
   */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Repository avec support des transactions
 */
export interface TransactionalUserRepository extends UserRepository {
  /**
   * Exécute plusieurs opérations en une seule transaction
   */
  withTransaction<T>(fn: (repo: UserRepository) => Promise<T>): Promise<T>;
}

// ============================================================================
// Unit of Work Pattern (Alternative)
// ============================================================================

/**
 * Unit of Work - regroupe les repositories et gère les transactions
 */
export interface UnitOfWork {
  readonly users: UserRepository;
  readonly products: ProductRepository;

  /**
   * Sauvegarde tous les changements en une transaction
   */
  commit(): Promise<void>;

  /**
   * Annule tous les changements
   */
  rollback(): Promise<void>;
}
