const mongoose = require('mongoose');
const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: 1
  },
  author: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true,
  },
},
{timestamps: true}
);

const Article = mongoose.model("Article",articleSchema);
module.exports = { Article }