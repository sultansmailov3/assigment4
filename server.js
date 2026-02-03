const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/db");

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

connectDB();

const measurementsRoutes = require("./src/routes/measurements");
app.use("/api/measurements", measurementsRoutes);
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Analytics Platform API running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
