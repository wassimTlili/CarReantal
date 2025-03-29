'use strict';

const { Reservation, Payment, Car, Contract } = require('../models');
const PaymentService = require('./paymentService');

class ReservationService {
  // Create a new reservation
  async createReservation(reservationData) {
    const { 
      customerId, 
      carId, 
      startDate, 
      endDate, 
      paymentMethodId 
    } = reservationData;

    // Find the car and calculate total price
    const car = await Car.findByPk(carId);
    if (!car) {
      throw new Error('Car not found');
    }

    // Calculate total price based on rental duration
    const rentalDuration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = car.price * rentalDuration;

    // Create a payment
    const paymentData = {
      subscriptionId: null, // Not a subscription, so null
      paymentMethodId,
      customerId
    };

    // Process payment
    const paymentResult = await PaymentService.processTransaction({
      ...paymentData,
      amount: totalPrice
    });

    // If payment is successful, create reservation
    if (paymentResult.success) {
      const reservation = await Reservation.create({
        customerId,
        carId,
        startDate,
        endDate,
        status: 'confirmed',
        totalPrice,
        paymentId: paymentResult.payment.id
      });

      return reservation;
    } else {
      throw new Error('Payment failed');
    }
  }

  // Generate contract after successful reservation
  async generateContract(reservationId) {
    const reservation = await Reservation.findByPk(reservationId, {
      include: ['customer', 'car']
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'confirmed') {
      throw new Error('Reservation must be confirmed to generate contract');
    }

    const contract = await Contract.create({
      reservationId,
      customerId: reservation.customerId,
      carId: reservation.carId,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      status: 'active',
      additionalTerms: `Rental of ${reservation.car.model} from ${reservation.startDate} to ${reservation.endDate}`
    });

    return contract;
  }

  // Cancel reservation
  async cancelReservation(reservationId) {
    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Check if reservation can be cancelled
    if (reservation.status === 'cancelled') {
      throw new Error('Reservation already cancelled');
    }

    // If payment exists, process refund
    if (reservation.paymentId) {
      await PaymentService.handleRefund(reservation.paymentId);
    }

    // Update reservation status
    reservation.status = 'cancelled';
    await reservation.save();

    return reservation;
  }
}

module.exports = new ReservationService();