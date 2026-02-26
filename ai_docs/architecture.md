# Afroplan Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Expo (React Native) + React 19 |
| Language | TypeScript |
| Navigation | Expo Router (File-based) |
| Styling | React Native Stylesheets (standard) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe (via @stripe/stripe-react-native) |
| State Management | React Context (Auth, Language) |
| Icons | @expo/vector-icons |

## Core Concepts

### Catalog Synchronization & Service Matching
- **Unified Catalog**: Both Clients and Coiffeurs use the exact same catalog structure (`constants/hairstyleCategories.ts`).
- **Precision Filtering**: When a client selects a specific style (e.g., "Box Braids"), the app queries the database (`salon.service.ts`) specifically for salons that have actively configured a service with that exact name.
- **Dynamic Pricing**: The SalonCard dynamically displays the exact price the professional set for the searched style, rather than a generic "starting from" price.

### Smart Image Fallback System
The application ensures a high-quality visual experience even if a professional hasn't uploaded their own portfolio photos yet:
1. **Level 1 (Custom)**: If the coiffeur uploads a photo for a service, it's displayed on the SalonCard.
2. **Level 2 (Catalog HD)**: If no custom photo is provided, the system automatically injects the high-definition reference photo from `HAIRSTYLE_CATEGORIES`.
3. **Level 3 (Salon Profile)**: As a last resort, the general salon image is used.

### Service Pricing & Flexibility
- **Customization**: Hairdressers (Coiffeurs) have full control over their offerings. They define their own prices and estimated durations for each style.
- **Custom Notes**: Hairdressers can add specific notes to each service (e.g., "Includes hair take-down", "Extra for long hair").
- **Location**: Services can be offered in-salon, at home, or both, as defined by the professional.

## Folder Structure

```
Afroplan_app/
├── app/                          # Expo Router routes
│   ├── (auth)/                   # Authentication flows (Login, Register)
│   ├── (coiffeur)/               # Hairdresser specific screens
│   ├── (salon)/                  # Salon owner dashboard & management
│   ├── (tabs)/                   # Main client navigation tabs
│   ├── booking/                  # Booking details and flow
│   ├── category-styles/          # Lists specific styles within a chosen category
│   ├── chat/                     # Messaging between client and coiffeur
│   ├── salon/                    # Salon public profile
│   └── style-salons/             # Salons filtered by specific hairstyle service

├── components/
│   ├── ui/                       # Reusable UI components (Button, Input, SalonCard, etc.)
│   └── ...                       # Other shared components
├── constants/                    # Theme, Hairstyles, etc.
├── contexts/                     # React Contexts (Auth, Language)
├── hooks/                        # Custom React hooks
├── services/                     # API and Business logic services
├── supabase/                     # Database schema, migrations and Edge Functions
├── types/                        # TypeScript definitions
└── assets/                       # Images, fonts, etc.
```

## User Roles

| Role | Description |
|------|-------------|
| Client | Browses salons, books services, leaves reviews, manages favorites. |
| Coiffeur | Individual hairdresser, can offer home services. |
| Salon Owner | Manages a physical salon, its services, and bookings. |
| Admin | Platform administrator with full access to all data. |

## Core Workflows

1. **Onboarding & Auth**: User selects a role and signs up/logs in via Supabase Auth.
2. **Discovery**: Clients search for salons by category (Afro-focused), city, or rating.
3. **Booking**: Clients select a service, date/time, and location (Salon/Home).
4. **Payment**: Secure payments via Stripe (Deposit or Full amount).
5. **Management**: Salons/Coiffeurs manage their availability, services, and incoming bookings.
