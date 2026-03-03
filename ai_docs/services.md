# Afroplan Services

## Service Architecture

Services are located in the `services/` directory and handle all communication with Supabase and external APIs (like Stripe).

| Service | Description |
|---------|-------------|
| `auth.service.ts` | Manages login, registration, and session state. |
| `salon.service.ts` | Handles salon fetching, filtering (including specific `serviceName` vs `category` ILIKE matches), Smart Image Fallbacks (injecting HD catalog photos if pros lack their own), and management. |
| `booking.service.ts` | Manages appointment creation, status updates, and history. |
| `client.service.ts` | Profile management and client-specific data. |
| `coiffeur.service.ts` | Management of coiffeur details and availability. |
| `payment.service.ts` | Stripe integration and payment processing. |
| `review.service.ts` | Submission and fetching of ratings and comments. |
| `favorite.service.ts` | Logic for bookmarking salons. |
| `promotion.service.ts` | Handling of discount codes and active deals. |

## Key Patterns

### Fetching Data
Services typically return Typed data from Supabase:
```typescript
async getSalonById(id: string): Promise<Salon | null> {
  const { data, error } = await supabase
    .from('salons')
    .select('*, services(*)')
    .eq('id', id)
    .single();
  // ... handling
}
```

### Service Definitions
- **Provider Autonomy**: The application does not define fixed prices or durations. These are entirely managed by the provider via `salon.service.ts` and UI interfaces.
- **Service Extensions**: Support for adding custom notes/précisions to each service, allowing providers to specify if they include take-down (démontage) or other extra tasks.

### Real-time
Some services might use Supabase Realtime for updates (e.g., chat messages or booking status changes).

### Stripe Integration
`payment.service.ts` interacts with Supabase Edge Functions to create payment intents and handle webhooks.

## Edge Functions

Located in `supabase/functions/`:
- `create-payment-intent`: Initiates a Stripe transaction.
- `create-user`: Handles custom logic during user creation.
- `stripe-webhook`: Receives events from Stripe (payment success, etc.).
