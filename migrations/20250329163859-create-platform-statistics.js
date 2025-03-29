// migrations/YYYYMMDDHHMMSS-create-platform-statistics.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PlatformStatistics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      totalAgencies: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeAgencies: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalCars: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalReservations: {
        type: Sequelize.INTEGER,
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
      period: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    await queryInterface.dropTable('PlatformStatistics');
  }
};