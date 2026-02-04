/**
 * Tenant context utilities for the community template
 * 
 * Provides helpers for tenant-scoped database operations.
 */

import { eq, and, SQL } from 'drizzle-orm';
import { DEFAULT_TENANT_ID } from './schema';

// Current tenant ID (set by middleware or context)
let currentTenantId: string = DEFAULT_TENANT_ID;

/**
 * Set the current tenant ID for database operations
 */
export function setCurrentTenant(tenantId: string): void {
  currentTenantId = tenantId;
}

/**
 * Get the current tenant ID
 */
export function getCurrentTenant(): string {
  return currentTenantId;
}

/**
 * Reset to default tenant (useful for testing)
 */
export function resetTenant(): void {
  currentTenantId = DEFAULT_TENANT_ID;
}

/**
 * Add tenant filter to a where clause
 * @param tenantIdColumn - The tenant_id column reference
 * @param existingCondition - Optional existing where condition to AND with
 */
export function withTenantFilter<T extends { tenantId: unknown }>(
  tenantIdColumn: T['tenantId'],
  existingCondition?: SQL
): SQL {
  const tenantCondition = eq(tenantIdColumn as unknown as Parameters<typeof eq>[0], currentTenantId);
  
  if (existingCondition) {
    return and(tenantCondition, existingCondition) as SQL;
  }
  
  return tenantCondition as SQL;
}

/**
 * Add tenant ID to insert data
 */
export function withTenantId<T extends Record<string, unknown>>(
  data: T
): T & { tenantId: string } {
  return {
    ...data,
    tenantId: currentTenantId,
  };
}

/**
 * Create a tenant-scoped query helper
 * Usage:
 * ```
 * const tenantQuery = createTenantQuery(db);
 * const posts = await tenantQuery.select().from(posts).where(eq(posts.type, 'post'));
 * ```
 */
export function createTenantQuery(db: unknown) {
  // This is a placeholder for a more sophisticated query builder
  // that automatically adds tenant filtering
  return db;
}

/**
 * Middleware helper to extract tenant from request
 */
export function getTenantFromRequest(req: {
  headers: { [key: string]: string | string[] | undefined };
  query: { [key: string]: string | string[] | undefined };
}): string {
  // Priority 1: Header
  const headerTenant = req.headers['x-tenant-id'];
  if (headerTenant && typeof headerTenant === 'string') {
    return headerTenant;
  }
  
  // Priority 2: Query param (dev only)
  const queryTenant = req.query.tenant;
  if (queryTenant && typeof queryTenant === 'string') {
    return queryTenant;
  }
  
  // Fallback to default
  return DEFAULT_TENANT_ID;
}

/**
 * API route wrapper that sets tenant context
 */
export function withTenant<T>(
  handler: (
    req: unknown,
    res: unknown,
    tenantId: string
  ) => Promise<T>
) {
  return async (req: { 
    headers: { [key: string]: string | string[] | undefined };
    query: { [key: string]: string | string[] | undefined };
  }, res: unknown): Promise<T> => {
    const tenantId = getTenantFromRequest(req);
    setCurrentTenant(tenantId);
    
    try {
      return await handler(req, res, tenantId);
    } finally {
      // Reset after request
      resetTenant();
    }
  };
}
