'use strict';

module.exports = (sequelize, DataTypes) => {
  class Customer extends sequelize.models.User {
    static associate(models) {
      // Define Customer-specific associations
      // For example, Customer can have many reservations
      Customer.hasMany(models.Reservation, { foreignKey: 'customerId' });
      Customer.hasMany(models.Review, { foreignKey: 'customerId' });
    }
  }

  Customer.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Customer',
    scopes: {
      customer: {
        where: {
          role: 'customer'
        }
      }
    }
  });

  // Add a scope to the User model for finding customers
  sequelize.models.User.addScope('customer', {
    where: {
      role: 'customer'
    }
  });

  return Customer;
};