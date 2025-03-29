'use strict';

module.exports = (sequelize, DataTypes) => {
  const Contract = sequelize.define('Contract', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Reservations',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.ENUM('active', 'completed', 'terminated'),
      defaultValue: 'active'
    },
    additionalTerms: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Contracts'
  });

  Contract.associate = function(models) {
    Contract.belongsTo(models.Reservation, { foreignKey: 'reservationId', as: 'reservation' });
    Contract.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Contract.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
  };

  return Contract;
};