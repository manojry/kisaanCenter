import { Request, Response } from 'express';
import { sequelize } from '../models/index';
import { success, created, failureCode, standardDelete } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { parseId } from '../shared/utils/parse';

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, category_id, description, unit } = req.body;
    if (!name || !category_id) {
      return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { required: ['name', 'category_id'] }, 'Missing required fields');
    }
    // Defensive numeric parse for category_id (avoid string causing implicit cast problems)
    const catIdNum = Number(category_id);
    if (!Number.isInteger(catIdNum) || catIdNum <= 0) {
      return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'category_id', reason: 'must be positive integer' }, 'Category does not exist');
    }

    const [categoryCheck] = await sequelize.query(
      'SELECT id FROM kisaan_categories WHERE id = :category_id',
      { replacements: { category_id: catIdNum } }
    );
    if (!categoryCheck || (Array.isArray(categoryCheck) && categoryCheck.length === 0)) {
      return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'category_id' }, 'Category does not exist');
    }

    // Perform insert; explicitly cast parameters.
    const [results] = await sequelize.query(
      `INSERT INTO kisaan_products (name, category_id, description, unit, created_at, updated_at)
       VALUES (:name, :category_id, :description, :unit, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          name: String(name).trim(),
          category_id: catIdNum,
          description: description ? String(description) : null,
          unit: unit ? String(unit) : null
        }
      }
    );
    const product = Array.isArray(results) ? results[0] : results;
    return created(res, product, { message: 'Product created successfully' });
  } catch (error: any) {
    // Provide richer diagnostics temporarily to unblock investigation
    const baseMessage = error?.message || 'Failed to create product';
    const diagnostics: any = {
      sql: error?.original?.sql || error?.sql,
      original: error?.original?.message,
      detail: error?.original?.detail,
      constraint: error?.original?.constraint,
      code: error?.original?.code,
      stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack
    };
    // Detect uniqueness violation via postgres code OR original message
    const isDuplicate = (diagnostics.code === '23505') || (diagnostics.original && /duplicate key/i.test(diagnostics.original));
    if (isDuplicate) {
      return failureCode(res, 409, ErrorCodes.PRODUCT_ALREADY_EXISTS, diagnostics, 'A product with this name and category already exists');
    }
    req.log?.error({ err: error, diagnostics }, 'product:create failed (enhanced)');
    return failureCode(res, 500, ErrorCodes.CREATE_PRODUCT_FAILED, diagnostics, baseMessage);
  }
};

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Allow optional sort param (?sort=created_desc|created_asc|name|id)
    const sort = (req.query.sort as string) || 'id_asc';
    let orderClause = 'p.id ASC';
    if (sort === 'created_desc') orderClause = 'p.created_at DESC';
    else if (sort === 'created_asc') orderClause = 'p.created_at ASC';
    else if (sort === 'name') orderClause = 'p.name ASC';
    else if (sort === 'id_desc') orderClause = 'p.id DESC';
    const query = `
      SELECT p.*, c.name as category_name
      FROM kisaan_products p
      LEFT JOIN kisaan_categories c ON p.category_id = c.id
      ORDER BY ${orderClause}`;
    const [results] = await sequelize.query(query);
    const list = Array.isArray(results) ? results : [];
    return success(res, list, { message: 'Products fetched', meta: { count: list.length, sort } });
  } catch (error: any) {
    req.log?.error({ err: error }, 'products:list failed');
    return failureCode(res, 500, ErrorCodes.GET_PRODUCTS_FAILED, undefined, error.message || 'Failed to fetch products');
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id, 'product');
    const [results] = await sequelize.query(
      `SELECT p.*, c.name as category_name
       FROM kisaan_products p
       LEFT JOIN kisaan_categories c ON p.category_id = c.id
  WHERE p.id = :id`,
      { replacements: { id } }
    );
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return failureCode(res, 404, ErrorCodes.PRODUCT_NOT_FOUND, undefined, 'Product not found');
    }
    const product = Array.isArray(results) ? results[0] : results;
    return success(res, product, { message: 'Product retrieved' });
  } catch (error: any) {
    req.log?.error({ err: error }, 'product:get failed');
    return failureCode(res, 500, ErrorCodes.GET_PRODUCT_FAILED, undefined, error.message || 'Failed to fetch product');
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id, 'product');

    // Extract allowed fields only
  const { name, category_id, description, unit, auto_resolve_name, ...ignored } = req.body || {};
    const updateData: any = {};
  const autoResolve = !!auto_resolve_name; // optional flag to auto-generate unique name on conflict

    // Validate & normalize name
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length === 0) {
        return failureCode(
          res,
          400,
          ErrorCodes.VALIDATION_ERROR,
          { field: 'name', reason: 'empty' },
          'Name cannot be empty'
        );
      }
      updateData.name = trimmed;
    }

    // Validate & verify category
    if (category_id !== undefined) {
      const catIdNum = Number(category_id);
      if (!Number.isInteger(catIdNum) || catIdNum <= 0) {
        return failureCode(
          res,
          400,
          ErrorCodes.VALIDATION_ERROR,
            { field: 'category_id', reason: 'must be positive integer' },
          'Invalid category'
        );
      }
      const [catRows] = await sequelize.query(
        'SELECT id FROM kisaan_categories WHERE id = :cid',
        { replacements: { cid: catIdNum } }
      );
      if (!Array.isArray(catRows) || catRows.length === 0) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'category_id' }, 'Category does not exist');
      }
      updateData.category_id = catIdNum;
    }

    if (description !== undefined) {
      updateData.description = description === null ? null : String(description);
    }
    if (unit !== undefined) {
      updateData.unit = unit === null ? null : String(unit);
    }

    if (Object.keys(updateData).length === 0) {
      return failureCode(res, 400, ErrorCodes.NO_FIELDS, undefined, 'No valid fields to update');
    }

    // Duplicate (name, category_id) check only if the final pair differs from existing record
    if (updateData.name !== undefined || updateData.category_id !== undefined) {
      // Fetch existing product to compare original values
      const [existingRows] = await sequelize.query(
        'SELECT id, name, category_id FROM kisaan_products WHERE id = :id',
        { replacements: { id } }
      );
      const existing = Array.isArray(existingRows) ? (existingRows as any[])[0] : existingRows;
      if (!existing) {
        return failureCode(res, 404, ErrorCodes.PRODUCT_NOT_FOUND, undefined, 'Product not found');
      }
      const finalName = updateData.name !== undefined ? updateData.name : existing.name;
      const finalCategory = updateData.category_id !== undefined ? updateData.category_id : existing.category_id;
      const nameChanged = finalName !== existing.name;
      const catChanged = Number(finalCategory) !== Number(existing.category_id);
      if (nameChanged || catChanged) {
        const [dupsRaw] = await sequelize.query(
          `SELECT id, name FROM kisaan_products
           WHERE name = :name AND category_id = :cat AND id <> :id
           LIMIT 1`,
          { replacements: { id, name: finalName, cat: finalCategory } }
        );
        const dups = Array.isArray(dupsRaw) ? (dupsRaw as any[]) : [];
        if (dups.length > 0) {
          if (autoResolve && updateData.name) {
            // Attempt automatic resolution by appending incremental numeric suffix
            try {
              const baseName = updateData.name;
              const [allNamesRaw] = await sequelize.query(
                `SELECT name FROM kisaan_products WHERE category_id = :cat AND name LIKE :pattern`,
                { replacements: { cat: finalCategory, pattern: baseName + '%' } }
              );
              const existingNames = new Set((Array.isArray(allNamesRaw) ? allNamesRaw : []).map((r:any) => r.name));
              let candidate = baseName;
              let counter = 2;
              // If base itself taken, iterate
              while (existingNames.has(candidate) && counter < 500) {
                candidate = `${baseName}-${counter}`;
                counter++;
              }
              if (existingNames.has(candidate)) {
                // Give up, still conflict after attempts
                return failureCode(
                  res,
                  409,
                  ErrorCodes.PRODUCT_ALREADY_EXISTS,
                  { conflict_with: dups[0].id, auto_resolve_attempted: true },
                  'A product with this name and category already exists (auto-resolve failed)'
                );
              }
              updateData.name = candidate; // adopt unique resolved name
              try { req.log?.info({ old: baseName, resolved: candidate }, 'product:auto-resolve-name'); } catch(_){}
            } catch (e) {
              // Fall back to standard conflict if auto resolve fails
              let conflictDetails: any = { conflict_with: dups[0].id, auto_resolve_error: (e as any)?.message };
              return failureCode(
                res,
                409,
                ErrorCodes.PRODUCT_ALREADY_EXISTS,
                conflictDetails,
                'A product with this name and category already exists'
              );
            }
          } else {
            // Fetch conflicting product details to enrich diagnostics
            let conflictDetails: any = { conflict_with: dups[0].id };
            try {
              const [confRows] = await sequelize.query(
                'SELECT id, name, category_id, unit, created_at, updated_at FROM kisaan_products WHERE id = :cid LIMIT 1',
                { replacements: { cid: dups[0].id } }
              );
              if (Array.isArray(confRows) && confRows[0]) {
                conflictDetails = { ...conflictDetails, existing: confRows[0] };
              }
            } catch (_) {/* swallow enrichment errors */}
            return failureCode(
              res,
              409,
              ErrorCodes.PRODUCT_ALREADY_EXISTS,
              conflictDetails,
              'A product with this name and category already exists'
            );
          }
        }
      }
    }

    // Build SQL SET clause safely
    const setClause = Object.keys(updateData).map(k => `${k} = :${k}`).join(', ');
    const [results] = await sequelize.query(
      `UPDATE kisaan_products SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *`,
      { replacements: { ...updateData, id } }
    );

    if (!results || (Array.isArray(results) && results.length === 0)) {
      return failureCode(res, 404, ErrorCodes.PRODUCT_NOT_FOUND, undefined, 'Product not found');
    }

    const product = Array.isArray(results) ? results[0] : results;
    return success(res, product, { message: 'Product updated successfully' });
  } catch (error: any) {
    const diagnostics: any = {
      code: error?.original?.code,
      detail: error?.original?.detail,
      constraint: error?.original?.constraint
    };
    // Unique violation (Postgres 23505)
    if (diagnostics.code === '23505') {
      return failureCode(
        res,
        409,
        ErrorCodes.PRODUCT_ALREADY_EXISTS,
        diagnostics,
        'A product with this name and category already exists'
      );
    }
    req.log?.error({ err: error, diagnostics }, 'product:update failed');
    return failureCode(
      res,
      500,
      ErrorCodes.UPDATE_PRODUCT_FAILED,
      diagnostics,
      error.message || 'Failed to update product'
    );
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id, 'product');
    const [results] = await sequelize.query(
  `DELETE FROM kisaan_products WHERE id = :id
       RETURNING *`,
      { replacements: { id } }
    );
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return failureCode(res, 404, ErrorCodes.PRODUCT_NOT_FOUND, undefined, 'Product not found');
    }
    return standardDelete(res, id, 'product');
  } catch (error: any) {
    req.log?.error({ err: error }, 'product:delete failed');
    return failureCode(res, 500, ErrorCodes.DELETE_PRODUCT_FAILED, undefined, error.message || 'Failed to delete product');
  }
};
