# Tests & Assurance Qualité

## PHPUnit avec Types Stricts

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Repository\UserRepositoryInterface;
use App\Service\UserService;
use App\Service\EmailService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class UserServiceTest extends TestCase
{
    private UserRepositoryInterface&MockObject $userRepository;
    private EmailService&MockObject $emailService;
    private UserService $userService;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepositoryInterface::class);
        $this->emailService = $this->createMock(EmailService::class);
        $this->userService = new UserService(
            $this->userRepository,
            $this->emailService
        );
    }

    public function testCreateUserSuccessfully(): void
    {
        $email = 'test@example.com';
        $password = 'SecurePass123!';

        $this->userRepository
            ->expects($this->once())
            ->method('findByEmail')
            ->with($email)
            ->willReturn(null);

        $this->userRepository
            ->expects($this->once())
            ->method('create')
            ->willReturn($this->createUser($email));

        $this->emailService
            ->expects($this->once())
            ->method('sendWelcomeEmail');

        $user = $this->userService->createUser($email, $password);

        $this->assertSame($email, $user->email);
    }

    public function testCreateUserThrowsExceptionWhenEmailExists(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Email already exists');

        $this->userRepository
            ->method('findByEmail')
            ->willReturn($this->createUser('test@example.com'));

        $this->userService->createUser('test@example.com', 'password');
    }

    private function createUser(string $email): User
    {
        return new User(
            id: 1,
            email: $email,
            password: password_hash('password', PASSWORD_ARGON2ID),
        );
    }
}
```

## Data Providers (PHPUnit 11+)

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Validator\EmailValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('validEmailProvider')]
    public function itValidatesCorrectEmails(string $email): void
    {
        $validator = new EmailValidator();
        $this->assertTrue($validator->isValid($email));
    }

    #[Test]
    #[DataProvider('invalidEmailProvider')]
    public function itRejectsInvalidEmails(string $email): void
    {
        $validator = new EmailValidator();
        $this->assertFalse($validator->isValid($email));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function validEmailProvider(): array
    {
        return [
            'standard email' => ['user@example.com'],
            'subdomain' => ['john.doe@company.co.uk'],
            'with filter' => ['test+filter@domain.org'],
        ];
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidEmailProvider(): array
    {
        return [
            'no at sign' => ['invalid'],
            'no local part' => ['@example.com'],
            'no domain' => ['user@'],
            'with space' => ['user space@example.com'],
        ];
    }
}
```

## Tests Fonctionnels Symfony

```php
<?php

declare(strict_types=1);

namespace Tests\Functional\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class UserControllerTest extends WebTestCase
{
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
    }

    public function testListUsersRequiresAuthentication(): void
    {
        $client = self::createClient();
        $client->request('GET', '/api/users');

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateUserWithValidData(): void
    {
        $client = self::createClient();
        $this->authenticateAs($client, 'admin@example.com');

        $client->request('POST', '/api/users', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'new@example.com',
            'password' => 'SecurePass123!',
            'name' => 'New User',
        ], JSON_THROW_ON_ERROR));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $response = json_decode(
            $client->getResponse()->getContent(),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $this->assertSame('new@example.com', $response['email']);
    }

    public function testCreateUserWithInvalidDataReturnsErrors(): void
    {
        $client = self::createClient();
        $this->authenticateAs($client, 'admin@example.com');

        $client->request('POST', '/api/users', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'not-an-email',
            'password' => 'short',
        ], JSON_THROW_ON_ERROR));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function authenticateAs($client, string $email): void
    {
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $client->loginUser($user);
    }
}
```

## Tests de Repositories Doctrine

```php
<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\User;
use App\Repository\DoctrineUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class UserRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private DoctrineUserRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $this->repository = self::getContainer()->get(DoctrineUserRepository::class);

        // Nettoyer la base de test
        $this->em->getConnection()->executeStatement('DELETE FROM users');
    }

    public function testFindByEmailReturnsNullWhenNotFound(): void
    {
        $result = $this->repository->findByEmail('nonexistent@example.com');

        $this->assertNull($result);
    }

    public function testSaveAndRetrieveUser(): void
    {
        $user = new User('test@example.com', 'hashed_password');
        $this->repository->save($user);

        $this->em->clear(); // Forcer un reload depuis la BDD

        $found = $this->repository->findByEmail('test@example.com');

        $this->assertNotNull($found);
        $this->assertSame('test@example.com', $found->getEmail());
    }

    protected function tearDown(): void
    {
        $this->em->close();
        parent::tearDown();
    }
}
```

## PHPStan Configuration

```neon
# phpstan.neon
parameters:
    level: 10
    paths:
        - src
        - tests
    excludePaths:
        - src/Kernel.php
        - vendor
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
    tmpDir: var/cache/phpstan

    ignoreErrors:
        # Ignorer les méthodes magiques Doctrine si nécessaire
        - '#Call to an undefined method Doctrine\\ORM\\EntityRepository#'

    type_coverage:
        return_type: 100
        param_type: 100
        property_type: 100

includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon
    - vendor/phpstan/phpstan-deprecation-rules/rules.neon
    - vendor/phpstan/phpstan-symfony/extension.neon
    - vendor/phpstan/phpstan-doctrine/extension.neon
```

## PHPStan Annotations pour Generics

```php
<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\ORM\EntityRepository;

/**
 * @extends EntityRepository<User>
 */
final class UserRepository extends EntityRepository
{
    /**
     * @return User[]
     */
    public function findActive(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status = :status')
            ->setParameter('status', 'active')
            ->getQuery()
            ->getResult();
    }

    /**
     * @param int[] $ids
     * @return User[]
     */
    public function findByIds(array $ids): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->getResult();
    }
}

/**
 * @template T
 * @template E of \Throwable
 */
final readonly class Result
{
    /**
     * @param T $data
     */
    private function __construct(
        public mixed $data,
        public bool $success,
        public ?\Throwable $error = null,
    ) {}

    /**
     * @template U
     * @param U $data
     * @return self<U, never>
     */
    public static function ok(mixed $data): self
    {
        return new self($data, true);
    }

    /**
     * @template F of \Throwable
     * @param F $error
     * @return self<never, F>
     */
    public static function fail(\Throwable $error): self
    {
        return new self(null, false, $error);
    }
}
```

## Code Coverage (phpunit.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         failOnRisky="true"
         failOnWarning="true"
         stopOnFailure="false">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Functional">
            <directory>tests/Functional</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">src</directory>
        </include>
        <exclude>
            <file>src/Kernel.php</file>
        </exclude>
        <report>
            <html outputDirectory="var/coverage/html"/>
            <clover outputFile="var/coverage/clover.xml"/>
        </report>
    </coverage>
    <php>
        <env name="APP_ENV" value="test"/>
        <env name="DATABASE_URL" value="sqlite:///:memory:"/>
        <env name="KERNEL_CLASS" value="App\Kernel"/>
    </php>
</phpunit>
```

## Quick Reference

| Outil | Fonction | Commande |
|-------|----------|----------|
| PHPUnit | Tests unitaires/fonctionnels | `./vendor/bin/phpunit` |
| PHPStan | Analyse statique | `./vendor/bin/phpstan analyse` |
| PHP-CS-Fixer | Style de code | `./vendor/bin/php-cs-fixer fix` |
| PHPMD | Détection de code smell | `./vendor/bin/phpmd src text cleancode` |

| Type de test | Répertoire | Scope |
|-------------|------------|-------|
| Unit | `tests/Unit/` | Classes isolées, mocks |
| Integration | `tests/Integration/` | Repositories, services avec BDD |
| Functional | `tests/Functional/` | Endpoints HTTP, workflow complet |

| Assertion | PHPUnit |
|-----------|---------|
| Égalité stricte | `$this->assertSame($expected, $actual)` |
| Type | `$this->assertInstanceOf(User::class, $result)` |
| Contenu | `$this->assertContains($item, $array)` |
| Exception | `$this->expectException(\DomainException::class)` |
| Comptage | `$this->assertCount(3, $items)` |
| Null | `$this->assertNull($value)` |
