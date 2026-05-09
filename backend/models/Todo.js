// ─────────────────────────────────────────────
// models/Todo.js — The shape of a Todo in MongoDB
//
// A "Model" defines what a Todo document looks like.
// Think of it like a table schema in SQL.
//
// Each todo will have:
//   - text      : the todo message (e.g. "Buy groceries")
//   - completed : true or false (is it done?)
//   - createdAt : timestamp added automatically
// ─────────────────────────────────────────────

const mongoose = require("mongoose");

// Define the shape (schema) of a single Todo
const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true, // Cannot save a todo without text
      trim: true, // Remove extra spaces from start/end
    },
    completed: {
      type: Boolean,
      default: false, // New todos start as NOT completed
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Export the model so routes/todos.js can use it
module.exports = mongoose.model("Todo", todoSchema);
