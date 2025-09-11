import { Plan, PlanCreationAttributes } from '../models/plan';
import { PlanCreate, PlanUpdate } from '../schemas/plan';
import { Op } from 'sequelize';

// Removed duplicate import of Plan


export const createPlan = async (data: PlanCreationAttributes): Promise<Plan> => {
  const plan = await Plan.create({
    name: data.name,
    description: data.description ?? null,
    price: data.price ?? null,
    monthly_price: data.monthly_price ?? null,
    quarterly_price: data.quarterly_price ?? null,
    yearly_price: data.yearly_price ?? null,
    max_farmers: data.max_farmers ?? null,
    max_buyers: data.max_buyers ?? null,
    max_transactions: data.max_transactions ?? null,
    data_retention_months: data.data_retention_months ?? null,
    features: data.features,
    status: data.status ?? 'active',
  });
  return plan;
};

export const getAllPlans = async (activeOnly: boolean = false): Promise<Plan[]> => {
  try {
    const where: any = {};
    if (activeOnly) where.status = 'active';
    
    const plans = await Plan.findAll({ 
      where,
      order: [['name', 'ASC']]
    });
    return plans;
  } catch (error: any) {
    console.error('Error in getAllPlans:', error.message);
    console.error('SQL:', error.sql);
    throw error;
  }
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

  await plan.update({ status: 'inactive' });
  return plan;
};

export const getActivePlans = async (): Promise<Plan[]> => {
  const plans = await Plan.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']]
  });
  return plans;
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
