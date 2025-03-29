'use strict';

module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    yearlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'SubscriptionPlans'
  });

  SubscriptionPlan.associate = function(models) {
    SubscriptionPlan.hasMany(models.Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  };

  return SubscriptionPlan;
};