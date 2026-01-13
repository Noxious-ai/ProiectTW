import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./sequelize.js";

import Student from "./models/student.js";
import Professor from "./models/profesor.js";
import Session from "./models/session.js";
import RequestDissertation from "./models/requestDissertation.js";

import apiRouter from "./routes/api.js";

const app = express();

// determina calea absoluta catre directorul curent (pentru ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// asigura existenta directorului pentru fisiere incarcate
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// middleware global pentru express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serveste fisierele incarcate static la ruta /uploads
app.use("/uploads", express.static(uploadsDir));

// rute principale ale aplicatiei (prefix /api)
app.use("/api", apiRouter);

// relatii sequelize intre modele
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

// portul pe care ruleaza serverul http
const port = process.env.PORT || 3000;

// porneste serverul dupa sincronizarea bazei de date
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("baza de date a fost sincronizata cu succes");

    app.listen(port, () => {
      console.log(`server pornit pe portul ${port}`);
    });
  } catch (err) {
    console.error("eroare la sincronizarea bazei de date:", err);
  }
};

startServer();

// handler global de erori
app.use((err, req, res, next) => {
  console.error("[EROARE SERVER]", err);
  res.status(500).json({ message: "eroare interna de server (500)" });
});

export default app;
