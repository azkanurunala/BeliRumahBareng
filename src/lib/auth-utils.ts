/**
 * Get actor role from user role number
 */
export function getActorRole(role: number): 'admin' | 'sales' | 'customer' {
  switch (role) {
    case 2:
      return 'admin';
    case 1:
      return 'sales';
    default:
      return 'customer';
  }
}

