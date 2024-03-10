const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cron = require("node-cron");
const User = require("./models/User");
const nodemailer = require("nodemailer");
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentDay = currentDate.getDate();
const cors = require("cors");
// Import routes
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://arulmozhikumar7:1234qwer@expandables.joiujak.mongodb.net/birthday_wisher",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    console.log("MongoDB connected");
    // Create index on the birthday field
    await User.createIndexes({ birthday: 1 });
    console.log("Index created on birthday field");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit process with failure
  });

// Routes
app.use("/api/users", userRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Schedule automatic birthday wishes
// Schedule automatic birthday wishes
const job = cron.schedule("* * * * *", async () => {
  try {
    console.log("Sending birthday wishes...");
    // Fetch users whose birthday is today and who haven't been wished yet
    const users = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$birthday" }, currentMonth + 1] }, // Month is zero-indexed in JavaScript Date objects
          { $eq: [{ $dayOfMonth: "$birthday" }, currentDay] },
        ],
      },
      wished: false, // Only fetch users who haven't been wished yet
    });

    // Send birthday wishes to each user
    for (const user of users) {
      const age = calculateAge(user.birthday);
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true", // Convert string to boolean
        auth: {
          user: process.env.EMAIL_USER || "arulmozhikumar7@gmail.com",
          pass: process.env.EMAIL_PASS || "tvkImS8MV4WX9qdH",
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER || "arulmozhikumar7@gmail.com",
        to: user.email,
        subject: "Happy Birthday!",
        text: `Dear ${user.name},\n\nHappy ${age}th birthday! We wish you a fantastic day filled with joy and happiness!\n\nBest regards ,\nArulmozhikumar`,
      };

      await transporter.sendMail(mailOptions);
      console.log("Birthday wish sent to:", user.email);

      // Mark the user as wished
      user.wished = true;
      await user.save();
    }
  } catch (error) {
    console.error("Error sending birthday wishes:", error);
  }
});
// Function to calculate age
function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
// Schedule automatic reset of wished field to run once a year on January 1st
const jobResetWishedField = cron.schedule("0 0 1 1 *", async () => {
  try {
    console.log("Resetting wished field...");
    // Reset wished field for all users
    await User.updateMany({}, { $set: { wished: false } });
    console.log("Wished field reset for all users.");
  } catch (error) {
    console.error("Error resetting wished field:", error);
  }
});

job.start();

jobResetWishedField.start();
