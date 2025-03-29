'use strict';

const ReservationService = require('../services/ReservationService');

class ReservationController {
  // Create a new reservation
  async createReservation(req, res) {
    try {
      const reservationData = {
        customerId: req.user.id,
        carId: req.body.carId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        paymentMethodId: req.body.paymentMethodId
      };

      const reservation = await ReservationService.createReservation(reservationData);

      return res.status(201).json({
        success: true,
        reservation
      });
    } catch (error) {
      console.error('Reservation creation error:', error);
      return res.status(500).json({ 
        error: 'Failed to create reservation',
        details: error.message 
      });
    }
  }

  // Get reservation by ID
  async getReservationById(req, res) {
    try {
      const reservation = await Reservation.findByPk(req.params.id, {
        include: ['customer', 'car', 'payment', 'contract']
      });

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      return res.status(200).json(reservation);
    } catch (error) {
      console.error('Error retrieving reservation:', error);
      return res.status(500).json({ error: 'Failed to retrieve reservation' });
    }
  }

  // Cancel reservation
  async cancelReservation(req, res) {
    try {
      const reservation = await ReservationService.cancelReservation(req.params.id);

      return res.status(200).json({
        success: true,
        reservation
      });
    } catch (error) {
      console.error('Reservation cancellation error:', error);
      return res.status(500).json({ 
        error: 'Failed to cancel reservation',
        details: error.message 
      });
    }
  }

  // Generate contract for a reservation
  async generateContract(req, res) {
    try {
      const contract = await ReservationService.generateContract(req.params.id);

      return res.status(201).json({
        success: true,
        contract
      });
    } catch (error) {
      console.error('Contract generation error:', error);
      return res.status(500).json({ 
        error: 'Failed to generate contract',
        details: error.message 
      });
    }
  }
}

module.exports = new ReservationController();