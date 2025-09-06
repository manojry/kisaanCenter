import { Plan } from '../models/plan';
import { PlanCreate, PlanUpdate } from '../schemas/plan';
import { Op } from 'sequelize';

export const createPlan = async (data: PlanCreate): Promise<Plan> => {
  const plan = await Plan.create({
    name: data.name,
    description: data.description ?? null,
    price: data.price,
    billing_cycle: data.billing_cycle,
    max_users: data.max_users ?? null,
    max_products: data.max_products ?? null,
    max_transactions: data.max_transactions ?? null,
    features: JSON.stringify(data.features || []),
    is_active: data.is_active ?? true,
  });
  return plan;
};

export const getAllPlans = async (activeOnly: boolean = false): Promise<Plan[]> => {
  const where: any = {};
  if (activeOnly) where.is_active = true;
  
  const plans = await Plan.findAll({ 
    where,
    order: [['name', 'ASC']]
  });
  return plans;
};

export const getPlanById = async (id: number): Promise<Plan | null> => {
  const plan = await Plan.findByPk(id);
  return plan;
};

export const updatePlan = async (id: number, data: PlanUpdate): Promise<Plan | null> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;

  const updateData: any = { ...data };
  
  // Convert features array to JSON string if provided
  if (data.features) {
    updateData.features = JSON.stringify(data.features);
  }
  
  // Convert null description to undefined for update
  if (data.description === null) {
    updateData.description = null;
  }

  await plan.update(updateData);
  return plan;
};

export const deletePlan = async (id: number): Promise<boolean> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return false;

  await plan.destroy();
  return true;
};

export const deactivatePlan = async (id: number): Promise<Plan | null> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;

  await plan.update({ is_active: false });
  return plan;
};

export const getActivePlans = async (): Promise<Plan[]> => {
  return getAllPlans(true);
};

export const searchPlans = async (searchTerm: string): Promise<Plan[]> => {
  const plans = await Plan.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    },
    order: [['name', 'ASC']]
  });
  return plans;
};
