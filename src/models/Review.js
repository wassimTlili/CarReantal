'use strict';

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Customers',
        key: 'id'
      }
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Reservations',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Reviews'
  });

  Review.associate = function(models) {
    Review.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Review.belongsTo(models.Reservation, { foreignKey: 'reservationId', as: 'reservation' });
  };

  return Review;
};