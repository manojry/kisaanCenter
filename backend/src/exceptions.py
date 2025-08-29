
class KisaanCenterException(Exception):
    """Base exception for KisaanCenter application"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class ValidationError(KisaanCenterException):
    """Raised when data validation fails"""
    pass

class BusinessRuleError(KisaanCenterException):
    """Raised when business rules are violated"""
    pass

class AuthenticationError(KisaanCenterException):
    """Raised when authentication fails"""
    pass

class AuthorizationError(KisaanCenterException):
    """Raised when user lacks permissions"""
    pass

class ResourceNotFoundError(KisaanCenterException):
    """Raised when requested resource is not found"""
    pass

class DatabaseError(KisaanCenterException):
    """Raised when database operations fail"""
    pass
