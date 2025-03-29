'use strict';

module.exports = (sequelize, DataTypes) => {
  class Admin extends sequelize.models.User {
    static associate(models) {
      // Define Admin-specific associations
      Admin.hasOne(models.PlatformStatistics, { 
        foreignKey: 'adminId', 
        as: 'platformStats' 
      });
    }
  }

  Admin.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Admin',
    scopes: {
      admin: {
        where: {
          role: 'admin'
        }
      }
    }
  });

  // This ensures the model is properly initialized after the User model
  sequelize.models.User.addScope('admin', {
    where: {
      role: 'admin'
    }
  });

  return Admin;
};