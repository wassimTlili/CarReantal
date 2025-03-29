const app = require('./app');
const { testConnection } = require('../config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3600;

// Test database connection
testConnection();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});