import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await apiClient.get('/products');
        setProducts(Array.isArray(resp) ? resp : resp.products || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (isLoading) return <div className="p-8">Loading products...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="container px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">{product.description}</div>
              <div className="font-medium">Price: ₹{product.price}</div>
              <div className="text-xs text-muted-foreground">Category ID: {product.category_id}</div>
              <div className="text-xs text-muted-foreground">Shop ID: {product.shop_id}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
