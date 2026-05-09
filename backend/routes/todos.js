// ─────────────────────────────────────────────
// routes/todos.js — All CRUD operations for Todos
//
// CRUD = Create, Read, Update, Delete
// These are the 4 things you can do with any data.
//
// Every route follows this pattern:
//   app.METHOD('/path', async (req, res) => {
//     // do something with the database
//     // send a response back
//   });
//
// req = the incoming request (has body, params, etc.)
// res = the response we send back to the frontend
// ─────────────────────────────────────────────

const express = require("express");
const router = express.Router(); // A mini Express app just for routes
const Todo = require("../models/Todo"); // Our Todo model (MongoDB schema)

// ── READ — Get all todos ────────────────────
// GET /api/todos
// Frontend calls this when the page loads to show all todos
router.get("/", async (req, res) => {
  try {
    // .find() with no arguments = get ALL todos from MongoDB
    // Sort by newest first (-1 = descending)
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos); // Send the list back as JSON
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// ── CREATE — Add a new todo ─────────────────
// POST /api/todos
// Frontend sends: { "text": "Buy groceries" }
router.post("/", async (req, res) => {
  try {
    // req.body.text = the text the user typed in the frontend
    const todo = new Todo({ text: req.body.text });

    // .save() writes it to MongoDB
    const savedTodo = await todo.save();

    res.status(201).json(savedTodo); // 201 = "Created" (success)
  } catch (err) {
    res.status(400).json({ error: "Failed to create todo" });
  }
});

// ── UPDATE — Toggle completed true/false ────
// PUT /api/todos/:id
// :id is a dynamic value — e.g. PUT /api/todos/64abc123
// Frontend sends: { "completed": true }
router.put("/:id", async (req, res) => {
  try {
    // findByIdAndUpdate finds the todo by its MongoDB _id
    // { $set: req.body } = update only the fields sent by frontend
    // { new: true }     = return the UPDATED document (not the old one)
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!todo) return res.status(404).json({ error: "Todo not found" });

    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: "Failed to update todo" });
  }
});

// ── DELETE — Remove a todo ──────────────────
// DELETE /api/todos/:id
// e.g. DELETE /api/todos/64abc123
router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) return res.status(404).json({ error: "Todo not found" });

    res.json({ message: "Todo deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

module.exports = router;
