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

## Folder Structure

```
Afroplan_app/
├── app/                          # Expo Router routes
│   ├── (auth)/                   # Authentication flows (Login, Register)
│   ├── (coiffeur)/               # Hairdresser specific screens
│   ├── (salon)/                  # Salon owner dashboard & management
│   ├── (tabs)/                   # Main client navigation tabs
│   ├── booking/                  # Booking details and flow
│   ├── chat/                     # Messaging between client and coiffeur
│   ├── salon/                    # Salon public profile
│   └── style-salons/             # Salons filtered by hairstyle category
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
