import express from "express";
import { Op } from "sequelize";

import Student from "../models/student.js";
import Professor from "../models/profesor.js";
import Session from "../models/session.js";
import RequestDissertation from "../models/requestDissertation.js";

const router = express.Router();

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
            return res.status(400).json({ message: "Missing name, email or password" });
        }

        const newStudent = await Student.create(body);
        return res.status(201).json(newStudent);
    } catch (err) {
        next(err);
    }
});

router.put("/students/:id", async (req, res, next) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: "Not found" });

        await student.update(req.body);
        return res.status(200).json(student);
    } catch (err) {
        next(err);
    }
})
.delete("/students/:id", async (req, res, next) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: "Not found" });

        await student.destroy();
        return res.status(200).json({ message: "Deleted successfully" });
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
            return res.status(400).json({ message: "Missing name, email, password or maxStudents" });
        }

        const newProfessor = await Professor.create(body);
        return res.status(201).json(newProfessor);
    } catch (err) {
        next(err);
    }
});

router.put("/professors/:id", async (req, res, next) => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (!professor) return res.status(404).json({ message: "Not found" });

        await professor.update(req.body);
        return res.status(200).json(professor);
    } catch (err) {
        next(err);
    }
})
.delete("/professors/:id", async (req, res, next) => {
    try {
        const professor = await Professor.findByPk(req.params.id);
        if (!professor) return res.status(404).json({ message: "Not found" });

        await professor.destroy();
        return res.status(200).json({ message: "Deleted successfully" });
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
            return res.status(400).json({ message: "Missing fields" });
        }

        const newSession = await Session.create(body);
        return res.status(201).json(newSession);
    } catch (err) {
        next(err);
    }
});

router.put("/sessions/:id", async (req, res, next) => {
    try {
        const session = await Session.findByPk(req.params.id);
        if (!session) return res.status(404).json({ message: "Not found" });

        await session.update(req.body);
        return res.status(200).json(session);
    } catch (err) {
        next(err);
    }
})
.delete("/sessions/:id", async (req, res, next) => {
    try {
        const session = await Session.findByPk(req.params.id);
        if (!session) return res.status(404).json({ message: "Not found" });

        await session.destroy();
        return res.status(200).json({ message: "Deleted" });
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
            return res.status(400).json({ message: "Missing required foreign keys" });
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

        if (!request) return res.status(404).json({ message: "Request not found" });

        // Actualizam mai intai campurile obisnuite (justification, fisiere etc.)
        await request.update(req.body);

        // Aplicam regulile suplimentare doar pentru status "approved"
        if (status === "approved") {

            const studentId = request.studentId;
            const professorId = request.professorId;
            const sessionId = request.sessionId;

            // A) Verifica limita de studenti aprobati pentru profesor
            const approvedCount = await RequestDissertation.count({
                where: { professorId, status: "approved" },
            });

            const professor = await Professor.findByPk(professorId);

            if (approvedCount >= professor.maxStudents) {
                await request.update({ status: "pending" });
                return res.status(400).json({
                    message: "Professor reached max number of approved students",
                });
            }

            // B) Verifica daca studentul este deja aprobat de un alt profesor
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
                    message: "Student has already been approved by another professor",
                });
            }

            // C) Valideaza daca cererea este in intervalul de timp al sesiunii
            const session = await Session.findByPk(sessionId);
            if (!session) {
                await request.update({ status: "pending" });
                return res.status(400).json({ message: "Session not found" });
            }

            const now = new Date();
            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            if (!(now >= start && now <= end)) {
                await request.update({ status: "pending" });
                return res.status(400).json({
                    message: "Request is not within session time range",
                });
            }
        }

        return res.status(200).json(request);

    } catch (err) {
        next(err);
    }
}).delete("/requests/:id", async (req, res, next) => {
    try {
        const request = await RequestDissertation.findByPk(req.params.id);
        if (!request) return res.status(404).json({ message: "Not found" });

        await request.destroy();
        return res.status(200).json({ message: "Deleted" });
    } catch (err) {
        next(err);
    }
});

// Login route (plain-text passwords, with role selector)
router.post("/login", async (req, res, next) => {
    try {
        const { role, email, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({ message: "Missing role, email or password" });
        }

        if (!["student", "professor"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        let user = null;

        if (role === "student") {
            user = await Student.findOne({ where: { email } });
        } else if (role === "professor") {
            user = await Professor.findOne({ where: { email } });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Payload de baza cu datele utilizatorului pentru frontend
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
