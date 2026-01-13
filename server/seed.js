import sequelize from "./sequelize.js";
import Professor from "./models/profesor.js";
import Student from "./models/student.js";
import Session from "./models/session.js";

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log("🗑️  DB resetată");

    // 👨‍🏫 Profesori
    const professors = await Professor.bulkCreate([
      {
        name: "Prof. Popescu Ion",
        email: "popescu@uni.ro",
        maxStudents: 5,
        password: "pass123",
      },
      {
        name: "Prof. Ionescu Maria",
        email: "ionescu@uni.ro",
        maxStudents: 6,
        password: "pass123",
      },
      {
        name: "Prof. Georgescu Andrei",
        email: "georgescu@uni.ro",
        maxStudents: 4,
        password: "pass123",
      },
      {
        name: "Prof. Dumitrescu Elena",
        email: "dumitrescu@uni.ro",
        maxStudents: 5,
        password: "pass123",
      },
      {
        name: "Prof. Stan Mihai",
        email: "stan@uni.ro",
        maxStudents: 7,
        password: "pass123",
      },
    ]);

    console.log("✅ Profesori creați");

    // 👨‍🎓 Studenți
    await Student.bulkCreate([
      { name: "Student A", email: "a@student.ro", password: "1234" },
      { name: "Student B", email: "b@student.ro", password: "1234" },
      { name: "Student C", email: "c@student.ro", password: "1234" },
      { name: "Student D", email: "d@student.ro", password: "1234" },
      { name: "Student E", email: "e@student.ro", password: "1234" },
    ]);

    console.log("✅ Studenți creați");

    // 📅 Sesiuni – 2 pentru fiecare profesor
    const sessions = [];

    professors.forEach((professor, index) => {
      // sesiunea 1
      sessions.push({
        professorId: professor.id,
        startDate: new Date(2026, index, 1),
        endDate: new Date(2026, index, 5),
      });

      // sesiunea 2
      sessions.push({
        professorId: professor.id,
        startDate: new Date(2026, index, 10),
        endDate: new Date(2026, index, 15),
      });
    });

    await Session.bulkCreate(sessions);

    console.log("✅ 2 sesiuni create pentru fiecare profesor");

    process.exit();
  } catch (error) {
    console.error("❌ Eroare la seed:", error);
    process.exit(1);
  }
}

seed();
