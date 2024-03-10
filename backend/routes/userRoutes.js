// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Route to register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, birthday, name } = req.body;
    const newUser = new User({ email, name, birthday });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get all users

module.exports = router;
