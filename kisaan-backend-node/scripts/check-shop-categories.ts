/**
 * DEPRECATED SCRIPT
 * This script has been intentionally gutted and retained only as a stub to avoid
 * accidental usage. Original functionality (shop category audit) is superseded by
 * unified schema + domain level validation flows.
 *
 * Replacement Path:
 *   - Use: npm run schema:validate   (structure level)
 *   - Implement forthcoming: npm run schema:structure (deep columns/FKs)
 *   - Domain flows covered by targeted integration tests.
 */
console.warn('[DEPRECATED] scripts/check-shop-categories.ts has been removed. Use schema validation + integration tests.');
process.exit(0);