/**
 * Jest setup file for AfroPlan tests
 * Note: jest.mock calls should be in individual test files for proper hoisting
 */

// Silence specific console.warn messages in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Supabase') || args[0].includes('Profil') || args[0].includes('AsyncStorage'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
