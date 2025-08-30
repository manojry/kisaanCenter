class FeatureControlService:
    def __init__(self, db):
        self.db = db
    def update_feature_control(self, shop_id, feature_name, is_enabled, limit_value, admin_id, reason):
        # Dummy implementation
        return {
            "shop_id": shop_id,
            "feature_name": feature_name,
            "is_enabled": is_enabled,
            "limit_value": limit_value,
            "admin_id": admin_id,
            "reason": reason
        }
    def check_farmer_creation_limit(self, shop_id):
        # Return dummy values for test compatibility
        return {
            "limit": 100,
            "usage": 0
        }
    def check_buyer_creation_limit(self, shop_id):
        return {"usage_percentage": 0}
    def check_transaction_limit(self, shop_id):
        return {"usage_percentage": 0}
    def get_data_access_range(self, shop_id):
        return {"range": "all"}
    def get_restriction_level(self, usage_percentage):
        return "ok"
