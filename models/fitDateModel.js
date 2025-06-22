// models/fitDataModel.js
const mongoose = require('mongoose');

const fitDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  steps: [{ type: Object }],
  heartRate: [{ type: Object }],
  calories: [{ type: Object }],
  sleep: [{ type: Object }],
  refreshToken: { type: String },
});

module.exports = mongoose.model('FitData', fitDataSchema);
