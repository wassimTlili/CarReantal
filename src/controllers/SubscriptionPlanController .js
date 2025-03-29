'use strict';

const { SubscriptionPlan, Subscription } = require('../models');

class SubscriptionPlanController {
  // Get all subscription plans
  async getAllPlans(req, res) {
    try {
      const plans = await SubscriptionPlan.findAll({
        where: {
          isActive: true
        }
      });
      
      return res.status(200).json(plans);
    } catch (error) {
      console.error('Error retrieving subscription plans:', error);
      return res.status(500).json({ error: 'Failed to retrieve subscription plans' });
    }
  }

  // Get subscription plan by ID
  async getPlanById(req, res) {
    try {
      const plan = await SubscriptionPlan.findByPk(req.params.id);
      
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      return res.status(200).json(plan);
    } catch (error) {
      console.error('Error retrieving subscription plan:', error);
      return res.status(500).json({ error: 'Failed to retrieve subscription plan' });
    }
  }

  // Create a new subscription plan
  async createPlan(req, res) {
    try {
      const { name, description, monthlyPrice, yearlyPrice, features, isActive } = req.body;
      
      if (!name || !monthlyPrice || !yearlyPrice) {
        return res.status(400).json({ error: 'Name, monthly price, and yearly price are required' });
      }
      
      const plan = await SubscriptionPlan.create({
        name,
        description,
        monthlyPrice,
        yearlyPrice,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true
      });
      
      return res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      return res.status(500).json({ error: 'Failed to create subscription plan' });
    }
  }

  // Update a subscription plan
  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const { name, description, monthlyPrice, yearlyPrice, features, isActive } = req.body;
      
      const plan = await SubscriptionPlan.findByPk(id);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      await plan.update({
        name: name || plan.name,
        description: description || plan.description,
        monthlyPrice: monthlyPrice || plan.monthlyPrice,
        yearlyPrice: yearlyPrice || plan.yearlyPrice,
        features: features || plan.features,
        isActive: isActive !== undefined ? isActive : plan.isActive
      });
      
      return res.status(200).json(plan);
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      return res.status(500).json({ error: 'Failed to update subscription plan' });
    }
  }

  // Delete a subscription plan (soft delete by setting isActive to false)
  async deletePlan(req, res) {
    try {
      const { id } = req.params;
      
      const plan = await SubscriptionPlan.findByPk(id);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      // Check if any active subscriptions use this plan
      const activeSubscriptions = await Subscription.count({
        where: {
          planId: id,
          isActive: true
        }
      });
      
      if (activeSubscriptions > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete plan. There are active subscriptions using this plan' 
        });
      }
      
      await plan.update({ isActive: false });
      
      return res.status(200).json({ message: 'Subscription plan deactivated successfully' });
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return res.status(500).json({ error: 'Failed to delete subscription plan' });
    }
  }
}

module.exports = new SubscriptionPlanController();