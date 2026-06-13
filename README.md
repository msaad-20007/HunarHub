# HunarHub — Premium Local Service Hiring Platform

HunarHub is a full-stack mobile application connecting customers with verified local Pakistani workers (Plumbers, Electricians, Painters, Mechanics, etc.). Built with **React Native (Expo)** frontend and a pure **Java OOP** backend using core `HttpServer` + JDBC — no Spring, no frameworks.

---

## 🌟 Features

- **Premium UI/UX** — Dark mode, gradients, micro-animations
- **Role-based Portals** — Separate flows for Admin, Worker, and Customer
- **Smart Booking System** — NORMAL, ADVANCE, and URGENT booking types
- **Real-time Chat** — In-app messaging between customers and workers
- **Worker Approval Flow** — Admin approves/rejects worker registrations
- **Ratings & Reviews** — Customers rate workers per booking
- **Automated Emails** — Gmail SMTP for welcome emails and booking alerts
- **3NF Database** — Composite attributes, weak entity, triggers, stored procedures

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, Expo SDK, React Navigation v6 |
| Backend | Java 17+ (tested on Java 26), `com.sun.net.httpserver`, JDBC |
| Database | MySQL 8+ |
| Build Tool | Apache Maven 3.6+ |
| Email | JavaMail (`javax.mail`) via Gmail SMTP |

---

## 📁 Project Structure

```
HunarHub/
├── backend/
│   ├── src/main/java/com/hunarhub/
│   │   ├── Main.java               ← Entry point, starts HTTP server
│   │   ├── api/                    ← Route handlers (AuthHandler, BookingHandler, etc.)
│   │   ├── dao/                    ← Database access (UserDAO, WorkerDAO, CustomerDAO)
│   │   ├── db/                     ← DatabaseConnection.java
│   │   ├── models/                 ← POJOs (User, Worker, Booking, etc.)
│   │   └── utils/                  ← EmailSender, OtpStore, IOUtils
│   ├── schema.sql                  ← Full DB schema (run this first)
│   ├── queries.sql                 ← 30 demo/analysis SQL queries
│   ├── ERD_Documentation.md        ← Full ERD + 3NF proof
│   ├── ERD_drawio.xml              ← Import into draw.io for visual ERD
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── screens/                ← All app screens (auth, customer, worker, admin)
│   │   ├── components/             ← Reusable UI components
│   │   ├── navigation/             ← AppNavigator.js
│   │   ├── context/                ← AuthContext.js
│   │   ├── services/               ← api.js (all HTTP calls)
│   │   └── theme/                  ← Theme.js (colors, fonts)
│   └── App.js
└── README.md
```

---

## ⚙️ Prerequisites

Make sure these are installed before running anything:

1. **Node.js** v18+ → [nodejs.org](https://nodejs.org)
2. **Java JDK 17+** → [adoptium.net](https://adoptium.net) *(project compiled with Java 26 — any JDK 17+ works)*
3. **Apache Maven 3.6+** → [maven.apache.org](https://maven.apache.org)
4. **XAMPP** (or any MySQL 8+ server) → [apachefriends.org](https://www.apachefriends.org)
5. **Expo Go** app on your phone → Play Store / App Store

Verify installations:
```bash
node -v
java -version
mvn -version
```

---

## 🗄️ Step 1 — Database Setup (XAMPP)

1. Open **XAMPP Control Panel** → Start **Apache** and **MySQL**
2. Open browser → go to `http://localhost/phpmyadmin`
3. Click **"New"** in the left sidebar → Database name: `hunarhub` → **Create**
4. Click the **SQL** tab at the top
5. Open `backend/schema.sql`, copy **all content**, paste into the SQL box → click **Go**

This creates all 12 tables, triggers, stored procedures, indexes, views, and seed data in one shot.

> **Verify:** Left sidebar should show `hunarhub` with tables: `users`, `workers`, `customers`, `categories`, `services`, `bookings`, `ratings`, `messages`, `notifications`, `worker_skills`, `user_phone_numbers`, `audit_log`

---

## 🔧 Step 2 — Backend Configuration

### 2a. Database credentials
Open `backend/src/main/java/com/hunarhub/db/DatabaseConnection.java` and update if needed:

```java
private static final String DB_URL  = "jdbc:mysql://localhost:3306/hunarhub";
private static final String DB_USER = "root";
private static final String DB_PASSWORD = "";   // XAMPP default is empty string
```

> **XAMPP default:** username = `root`, password = *(empty)*

### 2b. Email credentials (optional — only needed for email features)
Open `backend/src/main/java/com/hunarhub/utils/EmailSender.java`:

```java
private static final String EMAIL_USERNAME = "your_email@gmail.com";
private static final String EMAIL_PASSWORD = "your_app_password";  // Gmail App Password
```

> To generate a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

---

## ▶️ Step 3 — Run the Backend

Open a terminal in the `backend` folder and run these two commands:

```bash
# 1. Compile and build the JAR
mvn clean package -DskipTests

# 2. Run the server

**Expected output:**
```
Database connected successfully.
HunarHub Backend Server started on port 8080
```

> The server runs on `http://localhost:8080`. Keep this terminal open.

**Alternative (IDE):** Open the `backend` folder in IntelliJ IDEA or Eclipse and run `Main.java` directly.

---

## 📱 Step 4 — Run the Frontend

Open a **new terminal** in the `frontend` folder:

```bash
# Install dependencies (only needed first time)
npm install

# Start the Expo development server
npx expo start
```

**To open the app:**

| Method | Steps |
|---|---|
| Android Emulator | Press `a` in the terminal (Android Studio must be installed) |
| Physical Device | Scan the QR code with **Expo Go** app (same Wi-Fi required) |
| Web (limited) | Press `w` in the terminal |

---

## 🌐 Step 5 — Connect Frontend to Backend

Open `frontend/src/services/api.js` and check the `BASE_URL`:

```js
// For Android Emulator (default):
const BASE_URL = 'http://10.0.2.2:8080/api';

// For Physical Device — replace with your PC's local IP:
const BASE_URL = 'http://192.168.100.6:8080/api';
```

> Find your PC's local IP: run `ipconfig` (Windows) → look for **IPv4 Address** under your Wi-Fi adapter. Update this every time your IP changes.

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hunarhub.com` | `admin123` |
| Worker | Register via app | — |
| Customer | Register via app | — |

---

## 🗃️ Database Files

| File | Purpose |
|---|---|
| `backend/schema.sql` | Run once in phpMyAdmin — creates all tables, triggers, procedures |
| `backend/queries.sql` | 30 SQL queries for demonstration (SELECT, JOIN, AGGREGATE, CTE, Window Functions) |
| `backend/ERD_Documentation.md` | Full ERD documentation with 3NF proof and draw.io instructions |
| `backend/ERD_drawio.xml` | Import directly into [draw.io](https://app.diagrams.net) for visual ERD |

### How to import ERD in draw.io:
1. Go to [app.diagrams.net](https://app.diagrams.net)
2. Menu → **Extras → Edit Diagram**
3. Delete existing content, paste contents of `ERD_drawio.xml` → **OK**

---

## ❗ Common Issues & Fixes

| Problem | Fix |
|---|---|
| `Database connection failed` | Make sure XAMPP MySQL is running and password in `DatabaseConnection.java` matches |
| `Port 8080 already in use` | Kill the process: `netstat -ano \| findstr :8080` then `taskkill /PID <pid> /F` |
| `npm install` fails | Delete `node_modules` folder and `package-lock.json`, then run `npm install` again |
| App can't reach backend on physical device | Change `10.0.2.2` to your PC's IPv4 address in `api.js` |
| `UnsupportedClassVersionError` on `java` run | Your Java **runtime** is older than the compiler. Install JDK 17+ from [adoptium.net](https://adoptium.net), then open a new terminal so the updated PATH takes effect |
| Expo QR not scanning | Make sure phone and PC are on the same Wi-Fi network |

---

## 👤 Default Admin Account

Created automatically when you run `schema.sql`:
- **Email:** `admin@hunarhub.com`
- **Password:** `admin123`
