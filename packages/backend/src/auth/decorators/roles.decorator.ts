/**
 * Roles Decorator
 * @spec FEAT-001 REQ-4
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route
 */
export const Roles = (...roles: ('admin' | 'user')[]) =>
  SetMetadata(ROLES_KEY, roles);
