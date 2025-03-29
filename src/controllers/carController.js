const { Car, Reservation } = require("../models");
const { Op } = require("sequelize");
const upload = require("../utils/imageUpload"); 


// Get all cars
exports.getCars = async (req, res) => {
  try {
    const cars = await Car.findAll();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cars" });
  }
};

// Get a single car by ID
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: "Error fetching car" });
  }
};

// Create a new car
exports.createCar = async (req, res) => {
  try {
      upload.single('image')(req, res, async (err) => {
          if (err) {
              return res.status(400).json({ error: err.message });
          }

          const { brand, model, year, pricePerDay } = req.body;
          if (!req.file) {
              return res.status(400).json({ error: "Car image is required" });
          }

          const imageUrl = `/uploads/${req.file.filename}`;

          const car = await Car.create({
              brand,
              model,
              year,
              pricePerDay,
              image: imageUrl, // Save image path in DB
          });

          res.status(201).json(car);
      });
  } catch (error) {
      res.status(500).json({ error: "Error creating car" });
  }
};

// Update a car
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    await car.update(req.body);
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: "Error updating car" });
  }
};

// Delete a car
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    await car.destroy();
    res.json({ message: "Car deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting car" });
  }
};

// Get available cars for a date range
exports.getAvailableCars = async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const reservedCars = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            [Op.and]: [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }],
          },
        ],
      },
      attributes: ["carId"],
    });

    const reservedCarIds = reservedCars.map((res) => res.carId);
    const availableCars = await Car.findAll({ where: { id: { [Op.notIn]: reservedCarIds }, status: "available" } });
    res.json(availableCars);
  } catch (error) {
    res.status(500).json({ error: "Error fetching available cars" });
  }
};

// Set a car under maintenance
exports.setCarMaintenance = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    
    car.status = "maintenance";
    await car.save();
    res.json({ message: "Car set under maintenance" });
  } catch (error) {
    res.status(500).json({ error: "Error updating car status" });
  }
};

// Mark car as available after maintenance
exports.setCarAvailable = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    
    car.status = "available";
    await car.save();
    res.json({ message: "Car is now available" });
  } catch (error) {
    res.status(500).json({ error: "Error updating car status" });
  }
};
