// Database query utilities to eliminate duplication across services
import { sequelize } from '../models/index';
import { QueryTypes } from 'sequelize';
import { logger } from '../shared/logging/logger';

/**
 * Common database query patterns used across services
 */

/**
 * Check if a record exists by ID
 */
export const recordExists = async (table: string, id: number): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(
      `SELECT 1 FROM ${table} WHERE id = :id LIMIT 1`,
      { 
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );
    return Array.isArray(results) && results.length > 0;
  } catch (error: any) {
    logger.error({ err: error, table }, 'recordExists failed');
    return false;
  }
};

/**
 * Check if a record exists by field
 */
export const recordExistsByField = async (
  table: string, 
  field: string, 
  value: any
): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(
      `SELECT 1 FROM ${table} WHERE ${field} = :value LIMIT 1`,
      { 
        replacements: { value },
        type: QueryTypes.SELECT
      }
    );
    return Array.isArray(results) && results.length > 0;
  } catch (error: any) {
    logger.error({ err: error, table, field }, 'recordExistsByField failed');
    return false;
  }
};

/**
 * Get paginated results with optional filters
 */
export const getPaginatedResults = async (
  baseQuery: string,
  countQuery: string,
  params: any,
  pagination: { limit: number; offset: number }
): Promise<{ data: any[]; total: number }> => {
  try {
    // Get total count
    const [countResult] = await sequelize.query(countQuery, {
      replacements: params,
      type: QueryTypes.SELECT
    });
    const total = (countResult as any)?.count || 0;

    // Get paginated data
    const data = await sequelize.query(
      `${baseQuery} LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...params, ...pagination },
        type: QueryTypes.SELECT
      }
    );

    return { data, total };
  } catch (error: any) {
    logger.error({ err: error }, 'getPaginatedResults failed');
    throw error;
  }
};

/**
 * Soft delete a record (set status to inactive)
 */
export const softDelete = async (table: string, id: number): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(
      `UPDATE ${table} SET record_status = 'inactive', updated_at = NOW() WHERE id = :id`,
      { 
        replacements: { id },
        type: QueryTypes.UPDATE
      }
    );
    return (results as any) > 0;
  } catch (error: any) {
    logger.error({ err: error, table }, 'softDelete failed');
    return false;
  }
};

/**
 * Hard delete a record
 */
export const hardDelete = async (table: string, id: number): Promise<boolean> => {
  try {
    const result = await sequelize.query(
      `DELETE FROM ${table} WHERE id = :id`,
      { 
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );
    return (result as any) > 0;
  } catch (error: any) {
    logger.error({ err: error, table }, 'hardDelete failed');
    return false;
  }
};

/**
 * Update record status
 */
export const updateStatus = async (
  table: string, 
  id: number, 
  status: 'active' | 'inactive'
): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(
      `UPDATE ${table} SET record_status = :status, updated_at = NOW() WHERE id = :id`,
      { 
        replacements: { id, status },
        type: QueryTypes.UPDATE
      }
    );
    return (results as any) > 0;
  } catch (error: any) {
    logger.error({ err: error, table, id, status }, 'updateStatus failed');
    return false;
  }
};

/**
 * Get records by shop_id with optional filters
 */
export const getRecordsByShop = async (
  table: string,
  shopId: number,
  additionalFilters: string = '',
  additionalParams: any = {}
): Promise<any[]> => {
  try {
    const whereClause = `shop_id = :shopId${additionalFilters ? ` AND ${additionalFilters}` : ''}`;
    const data = await sequelize.query(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY created_at DESC`,
      {
        replacements: { shopId, ...additionalParams },
        type: QueryTypes.SELECT
      }
    );
    return data;
  } catch (error: any) {
    logger.error({ err: error, table, shopId }, 'getRecordsByShop failed');
    throw error;
  }
};

/**
 * Get active records only
 */
export const getActiveRecords = async (
  table: string,
  additionalFilters: string = '',
  additionalParams: any = {}
): Promise<any[]> => {
  try {
    const whereClause = `record_status = 'active'${additionalFilters ? ` AND ${additionalFilters}` : ''}`;
    const data = await sequelize.query(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY created_at DESC`,
      {
        replacements: additionalParams,
        type: QueryTypes.SELECT
      }
    );
    return data;
  } catch (error: any) {
    logger.error({ err: error, table }, 'getActiveRecords failed');
    throw error;
  }
};

/**
 * Search records by term
 */
export const searchRecords = async (
  table: string,
  searchFields: string[],
  searchTerm: string,
  additionalFilters: string = '',
  additionalParams: any = {}
): Promise<any[]> => {
  try {
    const searchConditions = searchFields
      .map(field => `${field} ILIKE :searchTerm`)
      .join(' OR ');
    
    const whereClause = `(${searchConditions})${additionalFilters ? ` AND ${additionalFilters}` : ''}`;
    
    const data = await sequelize.query(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY created_at DESC`,
      {
        replacements: { 
          searchTerm: `%${searchTerm}%`, 
          ...additionalParams 
        },
        type: QueryTypes.SELECT
      }
    );
    return data;
  } catch (error: any) {
    logger.error({ err: error, table, searchTerm }, 'searchRecords failed');
    throw error;
  }
};