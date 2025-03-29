// models/analyticsReport.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const AnalyticsReport = sequelize.define('AnalyticsReport', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    reportId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    reportType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    creatorDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    agencyId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Agencies',
        key: 'id'
      }
    }
  }, {
    tableName: 'AnalyticsReports',
    timestamps: true
  });

  AnalyticsReport.associate = function(models) {
    AnalyticsReport.belongsTo(models.Agency, { foreignKey: 'agencyId' });
  };

  return AnalyticsReport;
};