
export * from './user';
export { default as User } from './user';
// Add future models here for centralized exports

import sequelize from '../config/database';
import Shop from './shop';

// Initialize all models
const models = {
  Shop,
};

// Set up associations here if needed
// Example: Shop.belongsTo(User, { foreignKey: 'owner_id' });

export { sequelize, Shop };
export default models;