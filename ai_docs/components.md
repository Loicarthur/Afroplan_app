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
- **SalonCard**: Displays salon summary in search results. Supports a `searchedService` prop that dynamically alters the card to show the exact price and specific photo for the requested service (e.g., showing a "Box Braids" photo and its specific price instead of the generic salon logo and minimum price).
- **CategoryCard**: Represents a hair style category (e.g., Braids).
- **SearchBar**: Main search interface for finding salons.
- **BookingSummary**: Displays details of an appointment.

### Modals & Feedback
- **AuthGuardModal**: Prompts unauthenticated users to log in before performing actions.
- **SearchFlowModal**: Stepper-based search for location and service.
- **SuccessModal**: Feedback after booking or payment.
- **ServiceConfigModal**: (Internal to `(coiffeur)/services.tsx`) allows coiffeurs to set prices, durations, and notes with visual image feedback of the selected style.

## Special UI Features

### Visual Service Management & Pro UX
Coiffeurs receive rich visual feedback and motivation when managing their catalog:
- **Boost Banner**: A persistent banner encouraging pros to upload their own photos to increase conversion.
- **Custom Image Upload**: Pros can override default catalog images with their own work directly from the camera or gallery.
- **Status Indicators**: Visual badges (✅ / ℹ️) clearly distinguish between authentic pro photos and default catalog placeholders.
- **Thumbnail Previews**: In the style catalog and my-styles list.
- **Dynamic Headers**: Category headers focus on professional photography.

## Navigation Structure (`app/`)
The app uses Expo Router with the following structure:
- **(tabs)**: Bottom tab navigation (Home, Explore, Bookings, Profile).
- **(auth)**: Stack for Login and Registration.
- **(coiffeur)** & **(salon)**: Specific interfaces for providers.
- **Modals**: For deep-linking and focused tasks like `checkout` or `salon/[id]`.
