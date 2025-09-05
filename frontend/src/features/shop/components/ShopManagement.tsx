import React from 'react';
import ShopCreator from './ShopCreator';

const ShopManagement: React.FC = () => (
  <div className="shop-management">
    <h2>Shop Management (Superadmin)</h2>
    <ShopCreator />
  </div>
);

export default ShopManagement;
