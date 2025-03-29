'use strict';

const { Subscription, SubscriptionPlan, Agency, Payment } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize');

class SubscriptionController {
  // Get all subscriptions
  async getAllSubscriptions(req, res) {
    try {
      const subscriptions = await Subscription.findAll({
        include: [
          { model: Agency, as: 'agency' },
          { model: SubscriptionPlan, as: 'plan' }
        ]
      });
      
      return res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error retrieving subscriptions:', error);
      return res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
  }

  // Get subscription by ID
  async getSubscriptionById(req, res) {
    try {
      const subscription = await Subscription.findByPk(req.params.id, {
        include: [
          { model: Agency, as: 'agency' },
          { model: SubscriptionPlan, as: 'plan' }
        ]
      });
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  }

  // Create a new subscription
  async createSubscription(req, res) {
    try {
      const { agencyId, planId, startDate, endDate, isActive, status, autoRenew } = req.body;
      
      // Validate plan existence
      const plan = await SubscriptionPlan.findByPk(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      // Validate agency existence
      const agency = await Agency.findByPk(agencyId);
      if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      
      // Check for existing active subscriptions
      const existingSubscription = await Subscription.findOne({
        where: {
          agencyId,
          isActive: true,
          endDate: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (existingSubscription) {
        return res.status(400).json({ error: 'Agency already has an active subscription' });
      }
      
      // Create Stripe customer if doesn't exist
      let stripeCustomerId = agency.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          name: agency.name,
          email: agency.email,
          description: `Agency: ${agency.name}`,
          metadata: {
            agencyId: agency.id
          }
        });
        
        stripeCustomerId = customer.id;
        // Update agency with Stripe customer ID
        await agency.update({ stripeCustomerId });
      }
      
      // Create the subscription
      const subscription = await Subscription.create({
        agencyId,
        planId,
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
        status: status || 'active',
        autoRenew: autoRenew !== undefined ? autoRenew : true
      });
      
      return res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  // Update a subscription
  async updateSubscription(req, res) {
    try {
      const { id } = req.params;
      const { planId, endDate, isActive, status, autoRenew } = req.body;
      
      const subscription = await Subscription.findByPk(id);
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      // If changing plan, validate the new plan
      if (planId && planId !== subscription.planId) {
        const plan = await SubscriptionPlan.findByPk(planId);
        if (!plan) {
          return res.status(404).json({ error: 'Subscription plan not found' });
        }
      }
      
      await subscription.update({
        planId: planId || subscription.planId,
        endDate: endDate || subscription.endDate,
        isActive: isActive !== undefined ? isActive : subscription.isActive,
        status: status || subscription.status,
        autoRenew: autoRenew !== undefined ? autoRenew : subscription.autoRenew
      });
      
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  // Cancel a subscription
  async cancelSubscription(req, res) {
    try {
      const { id } = req.params;
      
      const subscription = await Subscription.findByPk(id, {
        include: [{ model: Agency, as: 'agency' }]
      });
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      if (subscription.status === 'cancelled') {
        return res.status(400).json({ error: 'Subscription is already cancelled' });
      }
      
      // If subscription has Stripe ID, cancel it there too
      if (subscription.agency && subscription.agency.stripeCustomerId) {
        const payments = await Payment.findOne({
          where: { 
            subscriptionId: id,
            status: 'active'
          }
        });
        
        if (payments && payments.stripePaymentIntentId) {
          // Cancel at Stripe
          await stripe.subscriptions.update(payments.stripePaymentIntentId, {
            cancel_at_period_end: true
          });
        }
      }
      
      await subscription.update({
        status: 'cancelled',
        isActive: false
      });
      
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  // Renew a subscription
  async renewSubscription(req, res) {
    try {
      const { id } = req.params;
      const { newEndDate } = req.body;
      
      if (!newEndDate) {
        return res.status(400).json({ error: 'New end date is required' });
      }
      
      const subscription = await Subscription.findByPk(id, {
        include: [
          { model: Agency, as: 'agency' },
          { model: SubscriptionPlan, as: 'plan' }
        ]
      });
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      await subscription.update({
        endDate: newEndDate,
        status: 'active',
        isActive: true
      });
      
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return res.status(500).json({ error: 'Failed to renew subscription' });
    }
  }
}

module.exports = new SubscriptionController();