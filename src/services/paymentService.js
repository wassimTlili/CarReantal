'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Payment, Subscription, SubscriptionPlan, Agency } = require('../models');

class PaymentService {
  // Process transaction using Stripe
  async processTransaction(paymentData) {
    try {
      const { subscriptionId, paymentMethodId, customerId } = paymentData;
      
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: SubscriptionPlan, as: 'plan' },
          { model: Agency, as: 'agency' }
        ]
      });
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      const plan = subscription.plan;
      const agency = subscription.agency;
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }
      
      // Determine if we're charging monthly or yearly
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
      
      // Process payment with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId || agency.stripeCustomerId,
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
        stripeCustomerId: customerId || agency.stripeCustomerId
      });
      
      return {
        success: paymentIntent.status === 'succeeded',
        payment,
        paymentIntent
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Validate payment information
  async validatePaymentInfo(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      return {
        valid: !!paymentMethod,
        paymentMethod
      };
    } catch (error) {
      console.error('Payment validation error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Handle refund
  async handleRefund(paymentId, amount, reason) {
    try {
      const payment = await Payment.findByPk(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
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
      
      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  // Generate invoice
  async generateInvoice(subscriptionId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: SubscriptionPlan, as: 'plan' },
          { model: Agency, as: 'agency' },
          { model: Payment, as: 'payments', limit: 1, order: [['createdAt', 'DESC']] }
        ]
      });
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      const agency = subscription.agency;
      const plan = subscription.plan;
      const latestPayment = subscription.payments && subscription.payments.length > 0 ? 
                            subscription.payments[0] : null;
      
      if (!agency || !plan) {
        throw new Error('Invalid subscription data');
      }
      
      if (!latestPayment) {
        throw new Error('No payment found for this subscription');
      }
      
      // Create invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: agency.stripeCustomerId,
        auto_advance: true, // Auto-finalize the invoice
        collection_method: 'charge_automatically',
        metadata: {
          subscriptionId,
          planId: plan.id,
          agencyId: agency.id
        }
      });
      
      // Add invoice items
      await stripe.invoiceItems.create({
        invoice: invoice.id,
        customer: agency.stripeCustomerId,
        amount: Math.round(latestPayment.amount * 100),
        currency: 'usd',
        description: `${plan.name} Subscription (${subscription.startDate.toLocaleDateString()} - ${subscription.endDate.toLocaleDateString()})`
      });
      
      // Finalize the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      
      return {
        success: true,
        invoice: finalizedInvoice
      };
    } catch (error) {
      console.error('Invoice generation error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();