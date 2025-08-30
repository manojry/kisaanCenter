class UsageTrackingService:
    def __init__(self, db):
        self.db = db
    def get_usage_summary(self, shop_id, days):
        return {}
    def predict_upgrade_need(self, shop_id):
        return "no upgrade needed"
    def track_usage(self, shop_id, feature_name, count):
        pass
