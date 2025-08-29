
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { createUser, updateUser } from '../services/userService';

interface UserFormData {
  username: string;
  password: string;
  role: string;
  contact: string;
  email?: string;
}

interface UserFormProps {
  user?: UserFormData;
  onSubmit?: (data: UserFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

interface FormErrors {
  username?: string;
  password?: string;
  role?: string;
  contact?: string;
  email?: string;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSubmit, 
  onCancel, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    password: user?.password || '',
    role: user?.role || '',
    contact: user?.contact || '',
    email: user?.email || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const createUserMutation = useMutation(createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setFormData({ username: '', password: '', role: '', contact: '', email: '' });
    }
  });

  const updateUserMutation = useMutation(updateUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
    }
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
    }

    // Role validation
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    // Contact validation
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid phone number';
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        if (isEdit) {
          await updateUserMutation.mutateAsync(formData);
        } else {
          await createUserMutation.mutateAsync(formData);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-form">
      <h2>{isEdit ? 'Edit User' : 'Create New User'}</h2>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={errors.username ? 'error' : ''}
            disabled={isEdit} // Username shouldn't be editable
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={errors.password ? 'error' : ''}
            placeholder={isEdit ? 'Leave blank to keep current password' : ''}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="role">Role *</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className={errors.role ? 'error' : ''}
          >
            <option value="">Select a role</option>
            <option value="FARMER">Farmer</option>
            <option value="BUYER">Buyer</option>
            <option value="SHOP_OWNER">Shop Owner</option>
            <option value="ADMIN">Admin</option>
          </select>
          {errors.role && <span className="error-message">{errors.role}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contact">Contact *</label>
          <input
            type="tel"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            className={errors.contact ? 'error' : ''}
            placeholder="+1234567890"
          />
          {errors.contact && <span className="error-message">{errors.contact}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
            placeholder="user@example.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Submitting...' : (isEdit ? 'Update User' : 'Create User')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
