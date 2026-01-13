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

router.get("/students", async (req, res, next) => {
    try {
        const students = await Student.findAll();
        return res.status(200).json(students);
    } catch (err) {
        next(err);
    }
})
.post("/students", async (req, res, next) => {
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

router.get("/professors", async (req, res, next) => {
    try {
        const professors = await Professor.findAll();
        return res.status(200).json(professors);
    } catch (err) {
        next(err);
    }
})
.post("/professors", async (req, res, next) => {
    try {
        const body = req.body;
        if (!body?.name || !body?.email || !body?.password || !body?.maxStudents) {
            return res.status(400).json({ message: "lipsesc numele, emailul, parola sau numarul maxim de studenti" });
        }

        const newProfessor = await Professor.create(body);

        // Cream automat trei sesiuni de inscriere pentru fiecare profesor nou
        try {
            const currentYear = new Date().getFullYear();

            const sessionsData = [
                {
                    professorId: newProfessor.id,
                    startDate: new Date(currentYear, 0, 1),
                    endDate: new Date(currentYear, 3, 30),
                },
                {
                    professorId: newProfessor.id,
                    startDate: new Date(currentYear, 4, 1),
                    endDate: new Date(currentYear, 7, 31),
                },
                {
                    professorId: newProfessor.id,
                    startDate: new Date(currentYear, 8, 1),
                    endDate: new Date(currentYear, 11, 31),
                },
            ];

            await Session.bulkCreate(sessionsData);
        } catch (sessionError) {
            // daca apar erori la crearea sesiunilor, nu blocam crearea profesorului
            console.error("eroare la crearea sesiunilor implicite pentru profesor:", sessionError);
        }

        return res.status(201).json(newProfessor);
    } catch (err) {
        next(err);
    }
});

router.get("/sessions", async (req, res, next) => {
    try {
        const sessions = await Session.findAll();
        return res.status(200).json(sessions);
    } catch (err) {
        next(err);
    }
})
.post("/sessions", async (req, res, next) => {
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

router.get("/requests", async (req, res, next) => {
    try {
        const requests = await RequestDissertation.findAll();
        return res.status(200).json(requests);
    } catch (err) {
        next(err);
    }
})
.post("/requests", async (req, res, next) => {
    try {
        const body = req.body;
        if (!body?.studentId || !body?.professorId || !body?.sessionId) {
            return res.status(400).json({ message: "lipsesc cheile externe obligatorii (student, profesor sau sesiune)" });
        }

        const newRequest = await RequestDissertation.create(body);
        return res.status(201).json(newRequest);
    } catch (err) {
        next(err);
    }
})
.put("/requests/:id", async (req, res, next) => {
    try {
        const { status } = req.body;
        const request = await RequestDissertation.findByPk(req.params.id);

        if (!request) return res.status(404).json({ message: "cererea nu a fost gasita" });

        // Actualizam mai intai campurile obisnuite (justification, fisiere etc.)
        await request.update(req.body);

        // Aplicam regulile suplimentare doar pentru status "approved"
        if (status === "approved") {

            const studentId = request.studentId;
            const professorId = request.professorId;
            const sessionId = request.sessionId;

            //verifica limita de studenti aprobati pentru profesor
            const approvedCount = await RequestDissertation.count({
                where: { professorId, status: "approved" },
            });

            const professor = await Professor.findByPk(professorId);

            if (approvedCount >= professor.maxStudents) {
                await request.update({ status: "pending" });
                return res.status(400).json({
                    message: "profesorul a atins numarul maxim de studenti aprobati",
                });
            }

            //verifica daca studentul este deja aprobat de un alt profesor
            const alreadyApproved = await RequestDissertation.findOne({
                where: {
                    studentId,
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

            //verifica doar ca sesiunea exista
            const session = await Session.findByPk(sessionId);
            if (!session) {
                await request.update({ status: "pending" });
                return res.status(400).json({ message: "sesiunea nu a fost gasita" });
            }
        }

        return res.status(200).json(request);

    } catch (err) {
        next(err);
    }
});

// upload fisier pdf semnat de student pentru o cerere aprobata
router.post("/requests/:id/student-file", upload.single("file"), async (req, res, next) => {
    try {
        const request = await RequestDissertation.findByPk(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "cererea nu a fost gasita" });
        }

        if (request.status !== "approved") {
            return res.status(400).json({ message: "cererea trebuie sa fie aprobata inainte de a incarca fisierul studentului" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "fisierul este obligatoriu" });
        }

        const filePath = `/uploads/${req.file.filename}`;
        // actualizam ambele campuri astfel incat studentul si profesorul sa vada acelasi fisier
        await request.update({ studentFile: filePath, professorFile: filePath });

        return res.status(200).json(request);
    } catch (err) {
        next(err);
    }
});

// upload fisier pdf profesor pentru o cerere (dupa aprobare / respingere)
router.post("/requests/:id/professor-file", upload.single("file"), async (req, res, next) => {
    try {
        const request = await RequestDissertation.findByPk(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "cererea nu a fost gasita" });
        }

        if (request.status === "pending") {
            return res.status(400).json({ message: "cererea trebuie sa fie aprobata sau respinsa inainte de a incarca fisierul profesorului" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "fisierul este obligatoriu" });
        }

        const filePath = `/uploads/${req.file.filename}`;
        // Actualizam ambele campuri astfel incat studentul si profesorul sa vada acelasi fisier
        await request.update({ studentFile: filePath, professorFile: filePath });

        return res.status(200).json(request);
    } catch (err) {
        next(err);
    }
});

// ruta de login (parole stocate ca text simplu, cu selector de rol)
router.post("/login", async (req, res, next) => {
    try {
        const { role, email, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({ message: "lipsesc rolul, emailul sau parola" });
        }

        if (!["student", "professor"].includes(role)) {
            return res.status(400).json({ message: "rol invalid" });
        }

        let user = null;

        if (role === "student") {
            user = await Student.findOne({ where: { email } });
        } else if (role === "professor") {
            user = await Professor.findOne({ where: { email } });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "credentiale invalide" });
        }

        // payload de baza cu datele utilizatorului pentru frontend
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
        };

        return res.status(200).json(payload);
    } catch (err) {
        next(err);
    }
});

export default router;
