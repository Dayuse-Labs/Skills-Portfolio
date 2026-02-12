# Async PHP Patterns

## PHP Fibers (Native PHP 8.1+)

```php
<?php

declare(strict_types=1);

// Basic Fiber - cooperative execution
$fiber = new Fiber(function (): string {
    $value = Fiber::suspend('started');
    return "Result: {$value}";
});

$status = $fiber->start();       // 'started'
$result = $fiber->resume('data'); // null (suspended or terminated)
$return = $fiber->getReturn();    // 'Result: data'
```

## Async/Await Pattern with Fibers

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

        // Start all fibers
        foreach ($this->fibers as $i => $fiber) {
            $fiber->start();
        }

        // Loop until all are terminated
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

// Usage
$runner = new AsyncRunner();
$runner
    ->add(fn() => fetchFromApi('/users'))
    ->add(fn() => fetchFromApi('/products'))
    ->add(fn() => fetchFromCache('stats'));

$results = $runner->runAll();
```

## Amphp (Async Framework)

```php
<?php

declare(strict_types=1);

use Amp\Http\Client\HttpClientBuilder;
use Amp\Http\Client\Request;
use function Amp\async;
use function Amp\Future\await;

// Concurrent HTTP requests
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

// Usage in a Symfony service
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

## Symfony Messenger (Message-based Async)

The most common async pattern in Symfony:

```php
<?php

declare(strict_types=1);

namespace App\Message;

// Immutable message
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

| Pattern | When to use | Complexity |
|---------|-------------|------------|
| Fibers | Concurrent I/O within a single process | Medium |
| Amphp | Async HTTP server, parallel requests | High |
| Messenger | Asynchronous jobs, queues, deferred events | Low (recommended) |
| Streams | Non-blocking file read/write | Medium |

**Dayuse recommendation**: Prefer Symfony Messenger for application-level async (bookings, notifications, emails). Reserve Fibers/Amphp for intensive I/O concurrency use cases.
