// models/agencyStatistics.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const AgencyStatistics = sequelize.define('AgencyStatistics', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    totalCars: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    availableCars: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reservedCars: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalReservations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completedReservations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    canceledReservations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(10, 2),
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
    monthlyBookings: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    },
    monthlyEarnings: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    agencyId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Agencies',
        key: 'id'
      }
    }
  }, {
    tableName: 'AgencyStatistics',
    timestamps: true
  });

  AgencyStatistics.associate = function(models) {
    AgencyStatistics.belongsTo(models.Agency, { foreignKey: 'agencyId' });
  };

  return AgencyStatistics;
};