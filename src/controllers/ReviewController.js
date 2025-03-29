'use strict';

const { Review, Reservation, Car } = require('../models');
const { Op, fn, col } = require('sequelize');
const { uploadMultipleImages } = require('../utils/imageUpload');

class ReviewController {
  // Create a new review
  async createReview(req, res) {
    try {
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = await uploadMultipleImages(req.files, 'reviews');
      }

      const { reservationId, carId, rating, comment } = req.body;
      const customerId = req.user.id;

      const reservation = await Reservation.findOne({
        where: { id: reservationId, customerId, carId }
      });
      if (!reservation) return res.status(400).json({ error: 'Invalid reservation for review' });

      const existingReview = await Review.findOne({ where: { reservationId } });
      if (existingReview) return res.status(400).json({ error: 'Review already submitted' });

      const review = await Review.create({
        customerId, carId, reservationId, rating, comment, status: 'pending', images: imageUrls
      });

      await this.updateCarAverageRating(carId);
      return res.status(201).json({ success: true, review });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create review', details: error.message });
    }
  }

  // Update an existing review
  async updateReview(req, res) {
    try {
      let imageUrls = req.body.existingImages || [];
      if (req.files && req.files.length > 0) {
        imageUrls = [...imageUrls, ...await uploadMultipleImages(req.files, 'reviews')];
      }

      const review = await Review.findByPk(req.params.id);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      review.comment = req.body.comment;
      review.images = imageUrls;
      review.status = 'pending';
      await review.save();

      return res.status(200).json({ success: true, review });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update review', details: error.message });
    }
  }

  // Delete a review
  async deleteReview(req, res) {
    try {
      const review = await Review.findByPk(req.params.id);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      const carId = review.carId;
      await review.destroy();
      await this.updateCarAverageRating(carId);

      return res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete review', details: error.message });
    }
  }

  // Get reviews for a specific car
  async getCarReviews(req, res) {
    try {
      const { carId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { carId, status: 'approved' },
        include: ['customer'],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        totalReviews: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        reviews
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve reviews', details: error.message });
    }
  }

  // Moderate a review (Admin)
  async moderateReview(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const review = await Review.findByPk(id);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      review.status = status;
      await review.save();

      if (status === 'approved') await this.updateCarAverageRating(review.carId);
      return res.status(200).json({ success: true, review });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to moderate review', details: error.message });
    }
  }

  // Update car's average rating
  async updateCarAverageRating(carId) {
    const reviewStats = await Review.findOne({
      where: { carId, status: 'approved' },
      attributes: [[fn('AVG', col('rating')), 'averageRating'], [fn('COUNT', col('id')), 'totalReviews']]
    });

    await Car.update({
      averageRating: parseFloat(reviewStats.get('averageRating') || 0).toFixed(1),
      totalReviews: reviewStats.get('totalReviews') || 0
    }, { where: { id: carId } });
  }
}

module.exports = new ReviewController();
