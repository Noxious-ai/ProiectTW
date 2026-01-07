# 🎓 Dissertation Management System (DMS)

Aplicatie web pentru gestionarea cererilor de înscriere la disertație, cu roluri Student–Profesor, perioade de înscriere și sistem de aprobare cereri.

---

## 📍 Obiectiv
Implementarea unei platforme web:
- Frontend: **React.js** (SPA)
- Backend: **Node.js + Express + PostgreSQL**
- Accesibilă printr-un API REST
- Manipulare persistentă a datelor (Sequelize ORM)
- Validări logice privind înscrierea la profesor

---

## 🧱 Arhitectura proiectului

proiect-web/
│
├── server/
│ ├── index.js # punctul de intrare Express
│ ├── models/ # Sequelize models (Student, Professor, Session, Request)
│ ├── routes/ # API REST routing
│ ├── sequelize.js # configurarea bazei de date
│ └── .env # variabile conexiune DB
│
├── client/
│ ├── src/
│ ├── App.js
│ └── components/ # componente React reutilizabile
│
└── README.md


---

## 🛠️ Tehnologii utilizate

### ⚙️ Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- dotenv

### 🎨 Frontend
- React.js
- CSS / Bootstrap

### 🔧 Tooling
- Postman – testare API
- GitHub – versionare

---

## 🚀 Funcționalități cheie

✔ Studenții pot trimite cereri la profesori  
✔ Profesorii pot aproba / respinge cereri  
✔ Limita de studenți la fiecare profesor  
✔ Un student poate fi aprobat o singură dată  
✔ Cererile sunt valide doar în perioada sesiunii  
✔ CRUD complet pentru toate entitățile

---

## 🧪 API Endpoints

### Studenți
| Method | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/students` | Listează studenții |
| POST | `/api/students` | Creare student |
| PUT | `/api/students/:id` | Actualizare student |
| DELETE | `/api/students/:id` | Ștergere student |

### Profesori
| Method | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/professors` | Listează profesorii |
| POST | `/api/professors` | Creare profesor |
| PUT | `/api/professors/:id` | Actualizare profesor |
| DELETE | `/api/professors/:id` | Ștergere profesor |

### Sesiuni înscriere
| Method | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/sessions` | Listează sesiunile |
| POST | `/api/sessions` | Creare sesiune |
| PUT | `/api/sessions/:id` | Actualizare |
| DELETE | `/api/sessions/:id` | Ștergere |

### Cereri disertație
| Method | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/requests` | Listează cererile |
| POST | `/api/requests` | Creează cerere |
| PUT | `/api/requests/:id` | Aprobare/Respingere |
| DELETE | `/api/requests/:id` | Ștergere |
| POST | `/api/requests/:id/upload` | Upload fișier *(în dezvoltare)* |

