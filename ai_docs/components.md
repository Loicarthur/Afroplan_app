# Afroplan UI Components

## Design System

Afroplan uses a custom theme (defined in `constants/theme.ts`) with a focus on a high-end Afro-hair aesthetic.

## Component Categories

### UI Primitives (`components/ui/`)
- **Button**: Customizable button with primary, secondary, and outline variants.
- **Input**: Standardized text input with label and error support.
- **Rating**: Star rating display and selection.
- **Badge**: Small labels for status or categories.

### Domain Components
- **SalonCard**: Displays salon summary in search results.
- **CategoryCard**: Represents a hair style category (e.g., Braids).
- **SearchBar**: Main search interface for finding salons.
- **BookingSummary**: Displays details of an appointment.

### Modals & Feedback
- **AuthGuardModal**: Prompts unauthenticated users to log in before performing actions.
- **SearchFlowModal**: Stepper-based search for location and service.
- **SuccessModal**: Feedback after booking or payment.

## Navigation Structure (`app/`)
The app uses Expo Router with the following structure:
- **(tabs)**: Bottom tab navigation (Home, Explore, Bookings, Profile).
- **(auth)**: Stack for Login and Registration.
- **(coiffeur)** & **(salon)**: Specific interfaces for providers.
- **Modals**: For deep-linking and focused tasks like `checkout` or `salon/[id]`.
