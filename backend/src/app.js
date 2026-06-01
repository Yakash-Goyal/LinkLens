const express = require("express");
const cors = require("cors");
const urlRoutes = require("./routes/urlRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "linklens-api",
    analyticsFocus: true,
  });
});

app.use("/", urlRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;
