'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Customers',
        key: 'id'
      }
    },
    carId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cars',
        key: 'id'
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Payments',
        key: 'id'
      }
    }
  }, {
    tableName: 'Reservations'
  });

  Reservation.associate = function(models) {
    Reservation.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Reservation.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
    Reservation.belongsTo(models.Payment, { foreignKey: 'paymentId', as: 'payment' });
    Reservation.hasOne(models.Contract, { foreignKey: 'reservationId', as: 'contract' });
  };

  return Reservation;
};