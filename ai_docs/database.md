# Afroplan Database Schema

## Core Entities

### Hierarchy
```
profiles (Users: clients, coiffeurs, admins)
  ├── salons (Physical locations or coiffeur identity)
  │     ├── services (Offered treatments)
  │     ├── gallery_images (Showcase)
  │     └── promotions (Discounts)
  ├── coiffeur_details (Specifics for individual coiffeurs)
  ├── bookings (Reservations between clients and salons)
  │     ├── payments (Stripe transactions)
  │     └── reviews (Client feedback)
  └── favorites (User bookmarks)
```

### Key Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `profiles` | User profiles (linked to Supabase Auth) | Yes |
| `categories` | Afro hair style categories (Braids, Locs, etc.) | Yes |
| `salons` | Salons or coiffeur profiles | Yes |
| `services` | Specific services offered by a salon | Yes |
| `bookings` | Appointments with status and payment tracking | Yes |
| `reviews` | Client ratings and comments (1-5 stars) | Yes |
| `favorites` | Bookmarked salons for clients | Yes |
| `coiffeur_details` | Bio, experience, and home service settings | Yes |
| `payments` | Stripe payment intents and transfer status | Yes |
| `promotions` | Discount codes and special offers | Yes |
| `stripe_accounts` | Connected accounts for salon owners | Yes |

## Enums

- `user_role`: `client`, `coiffeur`, `admin`
- `booking_status`: `pending`, `confirmed`, `cancelled`, `completed`
- `payment_method`: `full`, `deposit`, `on_site`
- `service_location_type`: `salon`, `domicile`, `both`

## Security (RLS)

The database uses Row Level Security extensively:
- **Admins**: Full access to everything via `is_admin()` helper.
- **Owners**: Access to their own salon data (services, bookings, etc.).
- **Clients**: Access to their own bookings, profiles, and public salon info.

Helper functions:
- `is_admin()`: Returns true if `auth.uid()` is an admin.
- `is_coiffeur()`: Returns true if `auth.uid()` is a coiffeur.
- `is_client()`: Returns true if `auth.uid()` is a client.

## Special Features

- **Haversine Distance**: `calculate_distance_km()` for finding nearby home-service coiffeurs.
- **Automatic Ratings**: `update_salon_rating()` trigger updates salon average rating on new reviews.
- **Promotion Validation**: `is_promotion_valid()` checks usage limits, dates, and service compatibility.
