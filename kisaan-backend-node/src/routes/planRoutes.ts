import { Router } from 'express';
import { planController } from '../controllers/planController';

export const planRoutes = Router();

// Plan CRUD routes
planRoutes.get('/', planController.getPlans);
planRoutes.get('/active', planController.getActivePlans);
planRoutes.get('/search', planController.searchPlans);
planRoutes.get('/:id', planController.getPlanById);
planRoutes.post('/', planController.createPlan);
planRoutes.put('/:id', planController.updatePlan);
planRoutes.patch('/:id/deactivate', planController.deactivatePlan);
planRoutes.delete('/:id', planController.deletePlan);

// Add route logging middleware
planRoutes.use((req, res, next) => {
  console.log(`Plan route: ${req.method} ${req.path}`);
  next();
});
