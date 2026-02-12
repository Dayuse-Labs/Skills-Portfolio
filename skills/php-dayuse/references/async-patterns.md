# Async PHP Patterns

## PHP Fibers (Native PHP 8.1+)

```php
<?php

declare(strict_types=1);

// Fiber de base - exécution coopérative
$fiber = new Fiber(function (): string {
    $value = Fiber::suspend('started');
    return "Result: {$value}";
});

$status = $fiber->start();       // 'started'
$result = $fiber->resume('data'); // null (suspended or terminated)
$return = $fiber->getReturn();    // 'Result: data'
```

## Pattern Async/Await avec Fibers

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Async;

final class AsyncRunner
{
    /** @var Fiber[] */
    private array $fibers = [];

    public function add(callable $task): self
    {
        $this->fibers[] = new Fiber($task);
        return $this;
    }

    /**
     * @return array<mixed>
     */
    public function runAll(): array
    {
        $results = [];

        // Démarrer toutes les fibers
        foreach ($this->fibers as $i => $fiber) {
            $fiber->start();
        }

        // Boucler jusqu'à ce que toutes soient terminées
        $pending = true;
        while ($pending) {
            $pending = false;
            foreach ($this->fibers as $i => $fiber) {
                if ($fiber->isSuspended()) {
                    $fiber->resume();
                    $pending = true;
                }
                if ($fiber->isTerminated() && !isset($results[$i])) {
                    $results[$i] = $fiber->getReturn();
                }
            }
        }

        return $results;
    }
}

// Utilisation
$runner = new AsyncRunner();
$runner
    ->add(fn() => fetchFromApi('/users'))
    ->add(fn() => fetchFromApi('/products'))
    ->add(fn() => fetchFromCache('stats'));

$results = $runner->runAll();
```

## Amphp (Framework Async)

```php
<?php

declare(strict_types=1);

use Amp\Http\Client\HttpClientBuilder;
use Amp\Http\Client\Request;
use function Amp\async;
use function Amp\Future\await;

// Requêtes HTTP concurrentes
function fetchMultipleEndpoints(array $urls): array
{
    $client = HttpClientBuilder::buildDefault();

    $futures = array_map(
        fn(string $url) => async(function () use ($client, $url): string {
            $response = $client->request(new Request($url));
            return $response->getBody()->buffer();
        }),
        $urls
    );

    return await($futures);
}

// Utilisation dans un service Symfony
final readonly class ConcurrentApiService
{
    public function __construct(
        private HttpClientBuilder $clientBuilder,
    ) {}

    /**
     * @param string[] $endpoints
     * @return array<string, mixed>
     */
    public function fetchAll(array $endpoints): array
    {
        $client = $this->clientBuilder->build();
        $futures = [];

        foreach ($endpoints as $name => $url) {
            $futures[$name] = async(function () use ($client, $url): array {
                $response = $client->request(new Request($url));
                $body = $response->getBody()->buffer();
                return json_decode($body, true, 512, JSON_THROW_ON_ERROR);
            });
        }

        return await($futures);
    }
}
```

## Symfony Messenger (Async par Messages)

Le pattern async le plus courant dans Symfony :

```php
<?php

declare(strict_types=1);

namespace App\Message;

// Message immutable
final readonly class ProcessBooking
{
    public function __construct(
        public int $bookingId,
        public string $action,
    ) {}
}

// Handler
namespace App\MessageHandler;

use App\Message\ProcessBooking;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ProcessBookingHandler
{
    public function __construct(
        private BookingServiceInterface $bookingService,
    ) {}

    public function __invoke(ProcessBooking $message): void
    {
        match ($message->action) {
            'confirm' => $this->bookingService->confirm($message->bookingId),
            'cancel' => $this->bookingService->cancel($message->bookingId),
            default => throw new \InvalidArgumentException("Unknown action: {$message->action}"),
        };
    }
}
```

```yaml
# config/packages/messenger.yaml
framework:
    messenger:
        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                retry_strategy:
                    max_retries: 3
                    delay: 1000
                    multiplier: 2
            failed: 'doctrine://default?queue_name=failed'

        routing:
            'App\Message\ProcessBooking': async
            'App\Message\SendNotification': async
```

## Quick Reference

| Pattern | Quand l'utiliser | Complexité |
|---------|------------------|------------|
| Fibers | I/O concurrentes dans un même process | Moyenne |
| Amphp | Serveur HTTP async, requêtes parallèles | Haute |
| Messenger | Jobs asynchrones, queues, événements différés | Faible (recommandé) |
| Streams | Lecture/écriture de fichiers non-bloquante | Moyenne |

**Recommandation Dayuse** : Préférer Symfony Messenger pour l'async applicatif (bookings, notifications, emails). Réserver Fibers/Amphp pour les cas de concurrence I/O intensive.
