/**
 * DEPRECATED SCRIPT
 * Data correction for NULL plan price values is now enforced via:
 *   - NOT NULL + DEFAULT constraints in schema (complete-schema.sql)
 *   - Application-level validation in PlanService
 *
 * Historical one-off fix no longer required.
 */
console.warn('[DEPRECATED] fix-plan-price.ts no longer needed; schema constraints enforce non-null prices.');
export {}; // keep module shape valid