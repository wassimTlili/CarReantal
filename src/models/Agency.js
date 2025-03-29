'use strict';

module.exports = (sequelize, DataTypes) => {
  class Agency extends sequelize.models.User {
    static associate(models) {
      // Define Agency-specific associations
      Agency.hasMany(models.Car, { foreignKey: 'agencyId', as: 'cars' });
      Agency.hasMany(models.Subscription, { foreignKey: 'agencyId', as: 'subscriptions' });
      Agency.hasOne(models.AgencyStatistics, { foreignKey: 'agencyId', as: 'statistics' });
      Agency.hasMany(models.AnalyticsReport, { foreignKey: 'agencyId', as: 'reports' });
    }
  }

  Agency.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    verificationDocs: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Agency',
    tableName: 'Agencies'
  });

  return Agency;
};