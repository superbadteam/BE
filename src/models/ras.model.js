const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const rasSchema = mongoose.Schema(
  {
    rasId: {
      type: String,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
rasSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Ras = mongoose.model('Ras', rasSchema);

module.exports = Ras;
