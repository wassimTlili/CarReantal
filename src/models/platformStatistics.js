// models/platformStatistics.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const PlatformStatistics = sequelize.define('PlatformStatistics', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    totalAgencies: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    activeAgencies: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalCars: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalReservations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    monthlyRevenue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    period: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'PlatformStatistics',
    timestamps: true
  });

  return PlatformStatistics;
};