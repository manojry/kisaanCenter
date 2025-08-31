"""
User model definition for authentication.
Re-exports the User model from the main models directory.
"""
from ....models.user import User

# Re-export the imported User model directly
__all__ = ['User']