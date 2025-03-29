'use strict';

const { Payment, Subscription, Agency, SubscriptionPlan } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  // Create a payment for a subscription
  async createPayment(req, res) {
    try {
      const { subscriptionId, paymentMethodId } = req.body;
      
      // Validate subscription
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: Agency, as: 'agency' },
          { model: SubscriptionPlan, as: 'plan' }
        ]
      });
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      if (!subscription.isActive) {
        return res.status(400).json({ error: 'Cannot process payment for inactive subscription' });
      }
      
      const agency = subscription.agency;
      const plan = subscription.plan;
      
      if (!agency || !plan) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }
      
      // Get or create Stripe customer
      let stripeCustomerId = agency.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          name: agency.name,
          email: agency.email,
          description: `Agency: ${agency.name}`
        });
        
        stripeCustomerId = customer.id;
        // Update agency with Stripe customer ID (this should be done in your Agency model)
        await agency.update({ stripeCustomerId });
      }
      
      // Attach payment method to customer if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId
        });
        
        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }
      
      // Determine price based on subscription duration
      const startDate = new Date(subscription.startDate);
      const endDate = new Date(subscription.endDate);
      const durationInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      
      let amount;
      if (durationInDays <= 32) {
        // Monthly plan
        amount = parseFloat(plan.monthlyPrice);
      } else {
        // Yearly plan
        amount = parseFloat(plan.yearlyPrice);
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        description: `Subscription: ${plan.name} (${subscription.id})`,
        metadata: {
          subscriptionId: subscription.id,
          planId: plan.id,
          agencyId: agency.id
        }
      });
      
      // Create payment record
      const payment = await Payment.create({
        subscriptionId: subscription.id,
        paymentType: 'subscription',
        amount,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        paymentMethod: 'card',
        paymentDate: new Date(),
        transactionId: paymentIntent.id,
        currency: 'USD',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId
      });
      
      // Update subscription status if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        await subscription.update({ status: 'active' });
      }
      
      return res.status(200).json({
        success: true,
        payment,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ 
        error: 'Failed to process payment',
        details: error.message 
      });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const payment = await Payment.findByPk(req.params.id, {
        include: [{ model: Subscription, as: 'subscription' }]
      });
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      return res.status(200).json(payment);
    } catch (error) {
      console.error('Error retrieving payment:', error);
      return res.status(500).json({ error: 'Failed to retrieve payment' });
    }
  }

  // Get all payments for a subscription
  async getPaymentsBySubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      
      const payments = await Payment.findAll({
        where: { subscriptionId },
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json(payments);
    } catch (error) {
      console.error('Error retrieving payments:', error);
      return res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle specific events
    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        await this.handleSuccessfulPayment(paymentIntent);
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        await this.handleFailedPayment(paymentIntent);
      }
      
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle successful payment webhook
  async handleSuccessfulPayment(paymentIntent) {
    try {
      // Find payment by transaction ID
      const payment = await Payment.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: [{ model: Subscription, as: 'subscription' }]
      });
      
      if (!payment) {
        console.error('Payment not found for webhook:', paymentIntent.id);
        return;
      }
      
      // Update payment status
      await payment.update({
        status: 'completed',
        paymentDate: new Date()
      });
      
      // Update subscription if needed
      if (payment.subscription) {
        await payment.subscription.update({
          status: 'active',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error handling successful payment webhook:', error);
    }
  }

  // Handle failed payment webhook
  async handleFailedPayment(paymentIntent) {
    try {
      // Find payment by transaction ID
      const payment = await Payment.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: [{ model: Subscription, as: 'subscription' }]
      });
      
      if (!payment) {
        console.error('Payment not found for webhook:', paymentIntent.id);
        return;
      }
      
      // Update payment status
      await payment.update({
        status: 'failed'
      });
      
      // Optional: Notify the agency about the failed payment
    } catch (error) {
      console.error('Error handling failed payment webhook:', error);
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      
      const payment = await Payment.findByPk(id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      if (payment.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed payments can be refunded' });
      }
      
      // Process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
        reason: reason || 'requested_by_customer'
      });
      
      // Update payment status
      await payment.update({
        status: amount && amount < payment.amount ? 'partially_refunded' : 'refunded'
      });
      
      return res.status(200).json({
        success: true,
        refund
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      return res.status(500).json({ error: 'Failed to process refund' });
    }
  }
}

module.exports = new PaymentController();