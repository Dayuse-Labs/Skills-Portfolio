/**
 * Exemple de Fichier de Test pour l'Entité User
 *
 * Ce fichier démontre :
 * - Structure des tests avec Vitest
 * - Tests des entités de domaine
 * - Tests des Value Objects
 * - Pattern Arrange-Act-Assert
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserError } from './domain-entity';
import { Email } from './value-object';
import { Result } from './result-type';

// ============================================================================
// Helper pour créer des emails valides dans les tests
// ============================================================================

function createValidEmail(emailStr: string = 'test@example.com'): Email {
  const result = Email.create(emailStr);
  if (!result.success) {
    throw new Error(`Email invalide dans le test: ${emailStr}`);
  }
  return result.data;
}

// ============================================================================
// Tests de l'Entité User
// ============================================================================

describe('User', () => {
  // Données de test réutilisables
  const validId = 'user-123-uuid';
  const validName = 'John Doe';
  const validDate = new Date('2024-01-15T10:00:00Z');
  let validEmail: Email;

  beforeEach(() => {
    validEmail = createValidEmail('john@example.com');
  });

  // ==========================================================================
  // Tests du Constructeur
  // ==========================================================================

  describe('constructor', () => {
    it('should create a user with all required properties', () => {
      // Arrange & Act
      const user = new User(validId, validName, validEmail, 'user', 'active', validDate);

      // Assert
      expect(user.id).toBe(validId);
      expect(user.name).toBe(validName);
      expect(user.email.value).toBe('john@example.com');
      expect(user.role).toBe('user');
      expect(user.status).toBe('active');
      expect(user.createdAt).toEqual(validDate);
    });

    it('should set default role to "user" when not specified', () => {
      const user = new User(validId, validName, validEmail);

      expect(user.role).toBe('user');
    });

    it('should set default status to "active" when not specified', () => {
      const user = new User(validId, validName, validEmail);

      expect(user.status).toBe('active');
    });

    it('should set createdAt to current date when not specified', () => {
      const before = new Date();
      const user = new User(validId, validName, validEmail);
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ==========================================================================
  // Tests de changeName
  // ==========================================================================

  describe('changeName', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validId, validName, validEmail, 'user', 'active', validDate);
    });

    it('should update name with valid input', () => {
      const result = user.changeName('Jane Smith');

      expect(result.success).toBe(true);
      expect(user.name).toBe('Jane Smith');
    });

    it('should trim whitespace from name', () => {
      const result = user.changeName('  Jane Smith  ');

      expect(result.success).toBe(true);
      expect(user.name).toBe('Jane Smith');
    });

    it('should update updatedAt timestamp', () => {
      const originalUpdatedAt = user.updatedAt;

      // Attendre un peu pour avoir un timestamp différent
      const result = user.changeName('Jane Smith');

      expect(result.success).toBe(true);
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('should return error when name is empty', () => {
      const result = user.changeName('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NAME_EMPTY');
      }
    });

    it('should return error when name is only whitespace', () => {
      const result = user.changeName('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NAME_EMPTY');
      }
    });

    it('should return error when name is too short', () => {
      const result = user.changeName('J');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NAME_TOO_SHORT');
        expect(result.error.minLength).toBe(2);
        expect(result.error.actualLength).toBe(1);
      }
    });

    it('should accept name at minimum length (2 characters)', () => {
      const result = user.changeName('Jo');

      expect(result.success).toBe(true);
      expect(user.name).toBe('Jo');
    });

    it('should return error when name is too long', () => {
      const longName = 'a'.repeat(101);
      const result = user.changeName(longName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NAME_TOO_LONG');
        expect(result.error.maxLength).toBe(100);
        expect(result.error.actualLength).toBe(101);
      }
    });

    it('should accept name at maximum length (100 characters)', () => {
      const maxName = 'a'.repeat(100);
      const result = user.changeName(maxName);

      expect(result.success).toBe(true);
      expect(user.name).toBe(maxName);
    });
  });

  // ==========================================================================
  // Tests de changeEmail
  // ==========================================================================

  describe('changeEmail', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validId, validName, validEmail, 'user', 'active', validDate);
    });

    it('should update email with valid Email value object', () => {
      const newEmail = createValidEmail('jane@example.com');

      user.changeEmail(newEmail);

      expect(user.email.value).toBe('jane@example.com');
    });

    it('should update updatedAt timestamp', () => {
      const newEmail = createValidEmail('jane@example.com');
      const originalUpdatedAt = user.updatedAt;

      user.changeEmail(newEmail);

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  // ==========================================================================
  // Tests des changements de rôle
  // ==========================================================================

  describe('role management', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validId, validName, validEmail, 'user', 'active', validDate);
    });

    it('should promote user to admin', () => {
      user.promoteToAdmin();

      expect(user.role).toBe('admin');
      expect(user.isAdmin).toBe(true);
    });

    it('should demote admin to user', () => {
      user.promoteToAdmin();
      user.demoteToUser();

      expect(user.role).toBe('user');
      expect(user.isAdmin).toBe(false);
    });
  });

  // ==========================================================================
  // Tests des changements de statut
  // ==========================================================================

  describe('status management', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validId, validName, validEmail, 'user', 'active', validDate);
    });

    it('should deactivate regular user', () => {
      const result = user.deactivate();

      expect(result.success).toBe(true);
      expect(user.status).toBe('inactive');
      expect(user.isActive).toBe(false);
    });

    it('should not allow deactivating admin', () => {
      user.promoteToAdmin();

      const result = user.deactivate();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('CANNOT_DEACTIVATE_ADMIN');
      }
      expect(user.status).toBe('active'); // Unchanged
    });

    it('should suspend user', () => {
      user.suspend();

      expect(user.status).toBe('suspended');
      expect(user.isActive).toBe(false);
    });

    it('should reactivate inactive user', () => {
      user.deactivate();
      user.activate();

      expect(user.status).toBe('active');
      expect(user.isActive).toBe(true);
    });
  });

  // ==========================================================================
  // Tests des propriétés calculées
  // ==========================================================================

  describe('computed properties', () => {
    it('should calculate account age in days correctly', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const user = new User(
        validId,
        validName,
        validEmail,
        'user',
        'active',
        thirtyDaysAgo
      );

      expect(user.accountAgeInDays).toBe(30);
    });

    it('should return 0 for user created today', () => {
      const user = new User(validId, validName, validEmail);

      expect(user.accountAgeInDays).toBe(0);
    });
  });

  // ==========================================================================
  // Tests d'égalité
  // ==========================================================================

  describe('equals', () => {
    it('should return true for same id regardless of other properties', () => {
      const user1 = new User(validId, 'Name 1', validEmail);
      const user2 = new User(
        validId,
        'Name 2',
        createValidEmail('other@example.com')
      );

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const user1 = new User('id-1', validName, validEmail);
      const user2 = new User('id-2', validName, validEmail);

      expect(user1.equals(user2)).toBe(false);
    });
  });

  // ==========================================================================
  // Tests de sérialisation
  // ==========================================================================

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const user = new User(
        validId,
        validName,
        validEmail,
        'admin',
        'active',
        validDate
      );

      const json = user.toJSON();

      expect(json).toEqual({
        id: validId,
        name: validName,
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        createdAt: validDate.toISOString(),
        updatedAt: expect.any(String),
      });
    });
  });
});

// ============================================================================
// Tests du Value Object Email
// ============================================================================

describe('Email', () => {
  describe('create', () => {
    it('should create email with valid format', () => {
      const result = Email.create('test@example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('test@example.com');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = Email.create('TEST@EXAMPLE.COM');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = Email.create('  test@example.com  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('test@example.com');
      }
    });

    it('should return error for empty email', () => {
      const result = Email.create('');

      expect(result.success).toBe(false);
    });

    it('should return error for email without @', () => {
      const result = Email.create('testexample.com');

      expect(result.success).toBe(false);
    });

    it('should return error for email without domain dot', () => {
      const result = Email.create('test@example');

      expect(result.success).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same email value', () => {
      const email1 = createValidEmail('test@example.com');
      const email2 = createValidEmail('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for same email with different casing', () => {
      const email1 = createValidEmail('test@example.com');
      const email2 = createValidEmail('TEST@EXAMPLE.COM');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = createValidEmail('test@example.com');
      const email2 = createValidEmail('other@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('domain', () => {
    it('should extract domain correctly', () => {
      const email = createValidEmail('user@example.com');

      expect(email.domain).toBe('example.com');
    });
  });

  describe('localPart', () => {
    it('should extract local part correctly', () => {
      const email = createValidEmail('user@example.com');

      expect(email.localPart).toBe('user');
    });
  });
});
