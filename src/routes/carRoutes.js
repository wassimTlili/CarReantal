const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Public Routes (Anyone can access)
router.get("/", carController.getCars);
router.get("/:id", carController.getCarById);
router.get("/available", carController.getAvailableCars);

// Protected Routes (Only Admins & Agency Owners can manage cars)
router.post("/", protect, restrictTo("admin", "agency"), carController.createCar);
router.put("/:id", protect, restrictTo("admin", "agency"), carController.updateCar);
router.delete("/:id", protect, restrictTo("admin", "agency"), carController.deleteCar);
router.put("/:id/maintenance", protect, restrictTo("admin", "agency"), carController.setCarMaintenance);
router.put("/:id/available", protect, restrictTo("admin", "agency"), carController.setCarAvailable);

module.exports = router;
