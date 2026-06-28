# 🏛️ Convention Hall CRM

A simple, mobile-friendly CRM for managing convention hall bookings, payments, and WhatsApp reminders.

---

## Project Structure

```
convention-hall-crm/
├── backend/     ← Spring Boot (Java 17) REST API
└── frontend/    ← React + Vite + Tailwind CSS
```

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| MySQL | 8.x | https://dev.mysql.com/downloads |
| Node.js | 18+ | https://nodejs.org |

---

## 1 — Database Setup

Open **MySQL Workbench** (or any MySQL client) and run:

```sql
CREATE DATABASE IF NOT EXISTS convention_hall_crm;
```

> The app auto-creates all tables on first startup via `spring.jpa.hibernate.ddl-auto=update`.

---

## 2 — Backend Setup

### 2a. Configure database password

Edit `backend/src/main/resources/application.properties` or create a local `.env` file from `backend/.env.example`:

```properties
DB_URL=jdbc:mysql://localhost:3306/convention_hall_crm?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
APP_PASSWORD=@nrkfunctionhall
JWT_SECRET=NRKFunctionHallCRM-JWT-SecretKey-2026-Min32Chars!
CORS_ORIGINS=http://localhost:5173,https://your-frontend-url.vercel.app
```

- `APP_PASSWORD` is already set to `@nrkfunctionhall` by default.
- `JWT_SECRET` should be a strong secret string at least 32 characters long; the example value is safe to use as-is.

### 2b. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts at **http://localhost:8080**.  
You should see: `Started CrmApplication` in the console.

---

## 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

---

## 4 — Using the App

| Page | What you can do |
|------|-----------------|
| **Dashboard** | See upcoming events, pending/overdue payments, 7-day follow-up alerts |
| **Bookings** | Add, edit, delete, search bookings; includes full booking form with amenities |
| **Calendar** | Monthly view of all bookings; click any date to see details |
| **Payments** | Track payment status, update advance paid, send WhatsApp reminders |

### Payment Status Rules (auto-computed)
| Status | Condition |
|--------|-----------|
| ✅ **PAID** | Remaining balance = ₹0 |
| 🟡 **PARTIAL** | Some advance paid, due date not yet passed |
| ⏳ **PENDING** | No advance paid, due date not yet passed |
| 🔴 **OVERDUE** | Remaining balance > 0 AND payment due date is past |

### WhatsApp Reminder
Each booking with a pending balance has a **WhatsApp** button that opens WhatsApp Web / app with a pre-filled message:

> *"Hello [Name], this is a reminder regarding your pending payment of ₹[Amount] for your event on [Date]…"*

### Double-booking Protection
The system prevents booking the hall on a date already taken (Confirmed or Tentative). Cancelled bookings do not block dates.

### Automatic Overdue Marking
A background scheduler runs every midnight (IST) and automatically marks unpaid bookings as **OVERDUE** once their payment due date passes.

---

## 5 — Build for Production

```bash
# Backend — creates target/crm-1.0.0.jar
cd backend
mvn clean package -DskipTests

# Run the jar
java -jar target/crm-1.0.0.jar

# Frontend — creates frontend/dist/
cd frontend
npm run build
```

You can serve the `dist/` folder with Nginx or any static host, proxying `/api` to the Spring Boot server.

---

## 6 — Deploying on Render

A ready-to-use `backend/Dockerfile` and root-level `render.yaml` are included to deploy the backend on Render.

1. Push your repo to GitHub.
2. Create a new Render Web Service.
3. Connect your repository and choose the `main` branch.
4. Use the Docker deploy method and set the following environment variables:

- `PORT=8080`
- `APP_PASSWORD=@nrkfunctionhall`
- `JWT_SECRET=NRKFunctionHallCRM-JWT-SecretKey-2026-Min32Chars!`
- `CORS_ORIGINS=https://your-frontend-url.vercel.app`
- `DB_URL=jdbc:mysql://mysql.railway.internal:3306/convention_hall_crm?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true`
- `DB_USERNAME=root`
- `DB_PASSWORD=<your-railway-database-password>`

If you prefer, keep the default `APP_PASSWORD` and `JWT_SECRET` values shown above; they are already supported by the backend.

> `JWT_SECRET` is the key used to sign JWT tokens. You can use the example secret above or generate a new random secret with at least 32 characters.

---

## 7 — Upgrading to WhatsApp Business API (Future)

The `buildWhatsAppUrl()` function in `frontend/src/api/bookingApi.js` is the only place to update.
Replace the `wa.me` redirect URL with a call to the official WhatsApp Cloud API:

```js
// Future: replace wa.me link with WhatsApp Cloud API call
// POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
```

---

## API Reference (Quick)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List all bookings |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}` | Delete booking |
| GET | `/api/bookings/search?q=` | Search by name/phone |
| GET | `/api/bookings/calendar?start=&end=` | Bookings in date range |
| PATCH | `/api/bookings/{id}/payment` | Update advance paid |
| GET | `/api/dashboard/stats` | Dashboard statistics |
