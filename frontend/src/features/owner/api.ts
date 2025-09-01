import { apiClient } from '@/services/api';

export const ownerAdminApi = {
  resetUserPassword: async (shopId: number, userId: number, newPassword: string) => {
    return apiClient.patch(`/owner-admin/shops/${shopId}/users/${userId}/password`, {
      new_password: newPassword,
      send_notification: true,
    });
  },
  setShopCommission: async (shopId: number, commissionRate: number) => {
    return apiClient.patch(`/owner-admin/shops/${shopId}/commission`, {
      commission_rate: commissionRate,
    });
  },
  assignProductsToShop: async (shopId: number, productIds: number[]) => {
    return apiClient.post(`/owner-admin/shops/${shopId}/products`, {
      selected_product_ids: productIds,
    });
  },
  getShopProducts: async (shopId: number) => {
    return apiClient.get(`/owner-admin/shops/${shopId}/products`);
  },
  updateUserStatus: async (shopId: number, userId: number, status: string) => {
    return apiClient.patch(`/owner-admin/shops/${shopId}/users/${userId}/status`, {
      new_status: status,
    });
  },
};
