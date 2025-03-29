// migrations/YYYYMMDDHHMMSS-create-agency-statistics.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AgencyStatistics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      totalCars: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      availableCars: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reservedCars: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalReservations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completedReservations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      canceledReservations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalRevenue: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      monthlyRevenue: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      averageRating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0
      },
      monthlyBookings: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      monthlyEarnings: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      agencyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Agencies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AgencyStatistics');
  }
};