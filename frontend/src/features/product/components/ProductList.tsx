import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../../components';
import { InputField, FormActions } from '../../../components/FormComponents';
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from '../api';
import { Product } from '../types';
import { UserRole } from '../../../types/enums';
import { useAuth } from '../../../context/AuthContext';
import './ProductList.css';

interface ProductListProps {
  // Props can be added here if needed in the future
}

export const ProductList: React.FC<ProductListProps> = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProducts = await fetchAllProducts();
      console.log('Received products:', allProducts);
      
      // Apply search filter
      let filteredProducts = allProducts;
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (pagination.current - 1) * pagination.pageSize;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pagination.pageSize);
      
      setProducts(paginatedProducts);
      setPagination(prev => ({ ...prev, total: filteredProducts.length }));
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowCreateModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id.toString());
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
  };

  const handleProductSaved = async () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    await loadProducts();
  };

  // Table columns configuration
  const columns: Column<Product>[] = [
    {
      key: 'name',
      title: 'Product Name',
      dataIndex: 'name',
      sortable: true,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (value: string) => (
        <div className="product-name">
          <span className="name">{value || 'Unnamed Product'}</span>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Price',
      dataIndex: 'price',
      sortable: true,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (value: number) => `$${(value || 0).toFixed(2)}`
    },
    {
      key: 'shop_id',
      title: 'Shop ID',
      dataIndex: 'shop_id',
      align: 'center',
      responsive: ['md', 'lg', 'xl'],
      render: (value: number) => value || 'N/A'
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (_: any, record: Product) => (
        <div className="action-buttons">
          <button
            onClick={() => handleEditProduct(record)}
            className="btn btn-sm btn-secondary"
            title="Edit product"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDeleteProduct(record)}
            className="btn btn-sm btn-error"
            title="Delete product"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  const canCreateProducts = user && [UserRole.SUPERADMIN, UserRole.OWNER, UserRole.EMPLOYEE].includes(user.role);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage product catalog and inventory items</p>
        </div>
        {canCreateProducts && (
          <div className="header-actions">
            <button onClick={handleCreateProduct} className="btn btn-primary">
              + Add Product
            </button>
          </div>
        )}
      </div>

      <div className="product-list">
        <div className="filters-section">
          <div className="filters-row">
            <InputField
              name="search"
              label="Search Products"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name..."
              icon="🔍"
              className="search-field"
            />
          </div>
        </div>

        <div className="table-section">
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              }
            }}
            onRowClick={(product) => console.log('Product clicked:', product)}
            empty={
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Products Found</h3>
                <p>No products have been added yet.</p>
                {canCreateProducts && (
                  <button onClick={handleCreateProduct} className="btn btn-primary">
                    Add Your First Product
                  </button>
                )}
              </div>
            }
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={loadProducts} className="btn btn-sm btn-secondary">
              Retry
            </button>
          </div>
        )}

        {showCreateModal && (
          <ProductModal
            product={editingProduct}
            onClose={handleModalClose}
            onSave={handleProductSaved}
          />
        )}
      </div>
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onSave
}) => {
  // Get shop_id from context (owner's shop)
  const { user } = useAuth();
  const shopId = user?.shop_id || 1;
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'price' ? parseFloat(value) || 0 : 
                          name === 'shop_id' ? parseInt(value) || 1 : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

  // shop_id is set from context, not user input

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (product) {
        const updateData: Partial<Product> = {
          name: formData.name,
          price: formData.price,
          shop_id: shopId
        };
        await updateProduct(product.id.toString(), updateData);
      } else {
        const createData: Partial<Product> = {
          name: formData.name,
          price: formData.price,
          shop_id: shopId
        };
        await createProduct(createData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving product:', err);
      setErrors({ submit: 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-content" style={{ background: '#fff' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <InputField
            name="name"
            label="Product Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            error={errors.name}
            placeholder="Enter product name"
          />

          <InputField
            name="price"
            label="Price ($)"
            type="number"
            step={0.01}
            min={0}
            value={formData.price.toString()}
            onChange={handleInputChange}
            required
            error={errors.price}
            placeholder="Enter product price"
          />

          {/* Shop ID is set from context and not editable by user */}

          {errors.submit && (
            <div className="alert alert-error">
              <span className="error-icon">⚠️</span>
              {errors.submit}
            </div>
          )}

          <FormActions>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </FormActions>
        </form>
      </div>
    </div>
  );
};

export default ProductList;