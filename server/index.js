import express from "express";
import cors from "cors";
import "dotenv/config";
import sequelize from "./sequelize.js";

import Student from "./models/student.js";
import Professor from "./models/profesor.js";
import Session from "./models/session.js";
import RequestDissertation from "./models/requestDissertation.js";

import apiRouter from "./routes/api.js";

const app = express();

// Middleware global pentru Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute principale ale aplicatiei (prefix /api)
app.use("/api", apiRouter);

// Relatii Sequelize intre modele
Professor.hasMany(Session, {
  foreignKey: "professorId",
  onDelete: "CASCADE",
});
Session.belongsTo(Professor, { foreignKey: "professorId" });

Professor.hasMany(RequestDissertation, {
  foreignKey: "professorId",
  onDelete: "CASCADE",
});
RequestDissertation.belongsTo(Professor, { foreignKey: "professorId" });

Student.hasMany(RequestDissertation, {
  foreignKey: "studentId",
  onDelete: "CASCADE",
});
RequestDissertation.belongsTo(Student, { foreignKey: "studentId" });

Session.hasMany(RequestDissertation, {
  foreignKey: "sessionId",
  onDelete: "CASCADE",
});
RequestDissertation.belongsTo(Session, { foreignKey: "sessionId" });

// Portul pe care ruleaza serverul HTTP
const port = process.env.PORT || 3000;

// Porneste serverul dupa sincronizarea bazei de date
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully!");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Database sync error: ", err);
  }
};

startServer();

// Handler global de erori
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);
  res.status(500).json({ message: "500 Server Error" });
});

export default app;
