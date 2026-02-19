# Afroplan Coding Patterns

## General Standards

- **TypeScript**: Strict typing is preferred. Use generated types from Supabase where possible.
- **Components**: Functional components with hooks.
- **Styling**: `StyleSheet.create` for React Native styling. Avoid inline styles for complex logic.
- **Naming**: 
  - Components: `PascalCase`
  - Files: `kebab-case` or `PascalCase` (following Expo Router conventions)
  - Functions/Variables: `camelCase`

## Service Pattern

Logic is separated from the UI. Controllers/Screens should call methods from `services/` rather than calling `supabase` directly.

```typescript
// Good
const { data } = await salonService.getSalons();

// Avoid in Screens
const { data } = await supabase.from('salons').select();
```

## Error Handling

- Use `ErrorBoundary` for catching rendering errors.
- Wrap service calls in `try/catch` and provide user feedback via Alerts or UI states.

## Testing Strategy

- **Unit Tests**: Located in `__tests__/`. Focus on services and utility functions.
- **Component Tests**: Using `@testing-library/react-native`.
- **E2E**: (To be defined)

## Git Workflow

- Features in separate branches.
- Clear commit messages focusing on "why".
- No secrets in the repository (use `.env`).
