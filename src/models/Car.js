'use strict';

module.exports = (sequelize, DataTypes) => {
  const Car = sequelize.define('Car', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'available'
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    agencyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Agencies',
        key: 'id'
      }
    }
  }, {
    tableName: 'Cars'
  });

  Car.associate = function(models) {
    Car.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
    //Car.hasMany(models.Reservation, { foreignKey: 'carId', as: 'reservations' });
  };

  return Car;
};