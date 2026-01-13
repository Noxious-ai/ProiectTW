import express from "express";
import { Op } from "sequelize";
import multer from "multer";
import path from "path";

import Student from "../models/student.js";
import Professor from "../models/profesor.js";
import Session from "../models/session.js";
import RequestDissertation from "../models/requestDissertation.js";

const router = express.Router();

// configurare storage pentru fisiere incarcate (pdf)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || ".pdf";
        cb(null, `request-${req.params.id || "file"}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage });

/* =========================
   STUDENTI
========================= */
router.get("/students", async (req, res, next) => {
    try {
        const students = await Student.findAll();
        return res.status(200).json(students);
    } catch (err) {
        next(err);
    }
});

router.post("/students", async (req, res, next) => {
    try {
        const body = req.body;
        if (!body?.name || !body?.email || !body?.password) {
            return res.status(400).json({ message: "lipsesc numele, emailul sau parola" });
        }

        const newStudent = await Student.create(body);
        return res.status(201).json(newStudent);
    } catch (err) {
        next(err);
    }
});

/* =========================
   PROFESORI
========================= */
router.get("/professors", async (req, res, next) => {
    try {
        const professors = await Professor.findAll();
        return res.status(200).json(professors);
    } catch (err) {
        next(err);
    }
});

router.post("/professors", async (req, res, next) => {
    try {
        const body = req.body;

        if (!body?.name || !body?.email || !body?.password || !body?.maxStudents) {
            return res.status(400).json({
                message: "lipsesc numele, emailul, parola sau numarul maxim de studenti",
            });
        }

        // 1️⃣ Creare profesor
        const newProfessor = await Professor.create(body);

        // 2️⃣ Creare AUTOMATA a 2 sesiuni pentru profesor
        const currentYear = new Date().getFullYear();

        await Session.bulkCreate([
            {
                professorId: newProfessor.id,
                startDate: new Date(currentYear, 0, 10), // 10 ianuarie
                endDate: new Date(currentYear, 0, 20),   // 20 ianuarie
            },
            {
                professorId: newProfessor.id,
                startDate: new Date(currentYear, 2, 1),  // 1 martie
                endDate: new Date(currentYear, 2, 10),   // 10 martie
            },
        ]);

        return res.status(201).json(newProfessor);
    } catch (err) {
        next(err);
    }
});

/* =========================
   SESIUNI
========================= */
router.get("/sessions", async (req, res, next) => {
    try {
        const sessions = await Session.findAll();
        return res.status(200).json(sessions);
    } catch (err) {
        next(err);
    }
});

router.post("/sessions", async (req, res, next) => {
    try {
        const body = req.body;
        if (!body?.professorId || !body?.startDate || !body?.endDate) {
            return res.status(400).json({ message: "lipsesc campuri obligatorii" });
        }

        const newSession = await Session.create(body);
        return res.status(201).json(newSession);
    } catch (err) {
        next(err);
    }
});

/* =========================
   CERERI – RUTE PER USER
========================= */

// cererile unui student
router.get("/students/:id/requests", async (req, res, next) => {
    try {
        const studentId = Number(req.params.id);

        const requests = await RequestDissertation.findAll({
            where: { studentId },
        });

        return res.status(200).json(requests);
    } catch (err) {
        next(err);
    }
});

// cererile unui profesor
router.get("/professors/:id/requests", async (req, res, next) => {
    try {
        const professorId = Number(req.params.id);

        const requests = await RequestDissertation.findAll({
            where: { professorId },
        });

        return res.status(200).json(requests);
    } catch (err) {
        next(err);
    }
});

/* =========================
   CERERI
========================= */
router.get("/requests", async (req, res, next) => {
    try {
        const requests = await RequestDissertation.findAll();
        return res.status(200).json(requests);
    } catch (err) {
        next(err);
    }
});

router.post("/requests", async (req, res, next) => {
    try {
        const body = req.body;

        if (!body?.studentId || !body?.professorId || !body?.sessionId) {
            return res.status(400).json({
                message: "lipsesc cheile externe obligatorii",
            });
        }

        const alreadyApproved = await RequestDissertation.findOne({
            where: {
                studentId: body.studentId,
                status: "approved",
            },
        });

        if (alreadyApproved) {
            return res.status(400).json({
                message: "Studentul a fost deja aprobat de un profesor",
            });
        }

        const newRequest = await RequestDissertation.create(body);
        return res.status(201).json(newRequest);
    } catch (err) {
        next(err);
    }
});

router.put("/requests/:id", async (req, res, next) => {
    try {
        const { status } = req.body;
        const request = await RequestDissertation.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "cererea nu a fost gasita" });
        }

        await request.update(req.body);

        if (status === "approved") {
            const approvedCount = await RequestDissertation.count({
                where: { professorId: request.professorId, status: "approved" },
            });

            const professor = await Professor.findByPk(request.professorId);

            if (approvedCount >= professor.maxStudents) {
                await request.update({ status: "pending" });
                return res.status(400).json({
                    message: "profesorul a atins numarul maxim de studenti",
                });
            }

            const alreadyApproved = await RequestDissertation.findOne({
                where: {
                    studentId: request.studentId,
                    status: "approved",
                    id: { [Op.ne]: request.id },
                },
            });

            if (alreadyApproved) {
                await request.update({ status: "pending" });
                return res.status(400).json({
                    message: "studentul a fost deja aprobat de un alt profesor",
                });
            }
        }

        return res.status(200).json(request);
    } catch (err) {
        next(err);
    }
});

/* =========================
   UPLOAD FISIERE
========================= */
router.post("/requests/:id/student-file", upload.single("file"), async (req, res, next) => {
    try {
        const request = await RequestDissertation.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "cererea nu a fost gasita" });
        }

        if (request.status !== "approved") {
            return res.status(400).json({
                message: "cererea trebuie sa fie aprobata inainte de upload",
            });
        }

        const filePath = `/uploads/${req.file.filename}`;
        await request.update({ studentFile: filePath, professorFile: filePath });

        return res.status(200).json(request);
    } catch (err) {
        next(err);
    }
});

router.post("/requests/:id/professor-file", upload.single("file"), async (req, res, next) => {
    try {
        const request = await RequestDissertation.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "cererea nu a fost gasita" });
        }

        if (request.status === "pending") {
            return res.status(400).json({
                message: "cererea trebuie sa fie aprobata sau respinsa",
            });
        }

        const filePath = `/uploads/${req.file.filename}`;
        await request.update({ studentFile: filePath, professorFile: filePath });

        return res.status(200).json(request);
    } catch (err) {
        next(err);
    }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res, next) => {
    try {
        const { role, email, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({ message: "lipsesc date de autentificare" });
        }

        const user =
            role === "student"
                ? await Student.findOne({ where: { email } })
                : await Professor.findOne({ where: { email } });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "credentiale invalide" });
        }

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
