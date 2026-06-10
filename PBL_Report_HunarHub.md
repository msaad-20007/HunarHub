# PBL_OOP_Java_HunarHub

---

**National University of Technology (NUTECH)**
**Department of Artificial Intelligence**
**Problem-Based Learning (PBL) Assignment — OOP Java System Design**
**Course:** Object-Oriented Programming (AI) | **Semester:** 2nd
**Project Title:** HunarHub — Local Service Hiring Platform

---

## 1. Problem Identification

### Selected Domain: Service Hiring & Worker Management System

In Pakistan, millions of households need skilled workers such as plumbers, electricians, painters, carpenters, and mechanics on a daily basis. The current process is completely manual and informal — people rely on word of mouth, local contacts, or random searches to find workers. There is no structured system to verify, contact, or book them.

### Existing Challenges

- No central platform to find verified skilled workers
- Customers have no way to check a worker's experience, rating, or availability
- Workers have no digital presence and depend entirely on referrals
- No accountability — customers cannot rate or review workers after a job
- Booking is done via phone calls with no record or confirmation
- Admin has no control over who is operating as a service provider

### Why Automation is Required

A software-based system solves all these problems by providing a structured, role-based platform where customers can search and book workers, workers can manage requests, and an admin can control approvals and monitor the platform. Automation removes errors, saves time, and adds accountability through ratings and booking history.

---

## 2. System Objectives

1. Allow customers to search and book verified skilled workers by category and city
2. Provide a worker registration and admin approval workflow to ensure only verified workers are listed
3. Manage the full booking lifecycle — from creation to acceptance, completion, and rating
4. Enable direct communication between customers and workers through in-app messaging
5. Give admin complete control over users, workers, bookings, and platform statistics
6. Send automated email notifications for all key events (registration, booking, approval, OTP)

---

## 3. System Design Overview

### How the System Works

A user opens the app and registers as either a Customer or a Worker. Workers go through admin approval before appearing in search results. Customers browse approved workers, view their profiles, and place bookings. Workers receive notifications, accept or reject bookings, and communicate with customers via chat. After job completion, customers rate the worker. The admin manages all users and monitors platform activity through a dashboard.

### User Roles

| Role | Responsibilities |
|---|---|
| **Customer** | Register, browse workers, create bookings, chat, rate workers |
| **Worker** | Register (pending approval), manage bookings, chat with customers |
| **Admin** | Approve/reject workers, view all users and bookings, delete users, view stats |

### Major System Modules

| Module | Description |
|---|---|
| Auth Module | Registration, login, forgot password with OTP, password reset |
| Worker Module | Browse workers, filter by category or city, view profiles |
| Booking Module | Create, accept, reject, complete bookings (NORMAL / ADVANCE / URGENT) |
| Chat Module | Real-time messaging between customer and worker |
| Rating Module | Star rating and review after job completion |
| Admin Module | Dashboard, worker approval, user management |
| Email Module | HTML email notifications via Gmail SMTP |


---

## 4. OOP-Based Design

### Classes and Objects

The system uses 20+ Java classes organized into five packages. Key objects include User, Worker, Customer, Admin, Booking, Message, Rating, and Service — each representing a real-world entity.

### Encapsulation

All model class fields are declared `private` or `protected`. They are accessed only through public getters and setters. No external class can read or modify data directly.

```java
public class User {
    protected String email;      // hidden from outside
    protected String password;   // hidden from outside

    public String getEmail()            { return email; }
    public void   setPassword(String p) { this.password = p; }
}
```

Database credentials are `private static final` inside `DatabaseConnection` — never accessible to any other class.

### Inheritance

`User` is the abstract parent class. `Worker`, `Customer`, and `Admin` all extend it, inheriting common fields (id, name, email, password, phone, city, role) and adding their own.

```
User (abstract)
├── Worker   → adds: cnic, category, approvalStatus, rating
├── Customer → adds: customerId
└── Admin    → no extra fields, different role behavior
```

### Polymorphism

The abstract method `getRoleDescription()` is declared in `User` and overridden in every subclass. At runtime, the correct version is called depending on the actual object type.

```java
User u = new Worker(...);
u.getRoleDescription(); // returns "Worker - Provides Plumber services"

User u = new Customer(...);
u.getRoleDescription(); // returns "Customer - Searches for workers"
```

All six API handler classes implement the `HttpHandler` interface — same method `handle(HttpExchange)`, different logic in each class. This is interface-based polymorphism.

### Abstraction

`User` is declared `abstract` — it cannot be instantiated directly. It defines the contract (`getRoleDescription()`) that all subclasses must implement. `HttpHandler` is a Java interface used as abstraction over all HTTP request handlers. Callers only know the interface; they do not know which specific handler is running.

---

## 5. Class Design

| Class | Package | Responsibility |
|---|---|---|
| `User` | models | Abstract base class. Holds id, name, email, password, phone, city, role. Declares abstract `getRoleDescription()` |
| `Worker` | models | Extends User. Adds cnic, whatsapp, category, approvalStatus, rating |
| `Customer` | models | Extends User. Adds customerId |
| `Admin` | models | Extends User. Platform administrator with no extra fields |
| `Booking` | models | Holds bookingId, customerId, workerId, type (NORMAL/ADVANCE/URGENT), status lifecycle |
| `Message` | models | Holds senderId, receiverId, text, timestamp for chat |
| `Rating` | models | Holds customerId, workerId, stars (1–5), review text |
| `Service` | models | A service offered by a worker. Weak entity — cannot exist without worker |
| `Category` | models | Master list of service types (Plumber, Electrician, etc.) |
| `DatabaseConnection` | db | Static factory. Opens MySQL connection via JDBC. Constructor is private |
| `UserDAO` | dao | getUserByEmail(), createUser() — SQL operations on users table |
| `WorkerDAO` | dao | createWorker() — resolves category name to ID, inserts into workers |
| `CustomerDAO` | dao | createCustomer() — inserts into customers table |
| `AuthHandler` | api | 5 inner static handler classes: Register, Login, ForgotPassword, VerifyOtp, ResetPassword |
| `WorkerHandler` | api | GET all approved workers, GET worker by ID with services and reviews |
| `BookingHandler` | api | Create booking, get bookings by customer/worker, update status |
| `AdminHandler` | api | 7 inner handler classes: Stats, PendingWorkers, AllWorkers, Approve, Customers, DeleteUser, AllBookings |
| `MessageHandler` | api | GET conversation between two users, POST new message |
| `UserHandler` | api | GET and PUT user profile, POST change password |
| `EmailSender` | utils | Sends 10 types of HTML emails via Gmail SMTP |
| `OtpStore` | utils | Thread-safe in-memory OTP storage with 10-minute expiry |
| `IOUtils` | utils | Reads HTTP request body as string |
| `Main` | root | Entry point. Starts HttpServer on port 8080, registers all URL contexts |

### Class Relationships

- `Worker`, `Customer`, `Admin` — **Inheritance** (extends User)
- `UserDAO`, `WorkerDAO`, `CustomerDAO` — **Association** with model classes
- `AuthHandler` — **Dependency** on UserDAO, WorkerDAO, CustomerDAO, EmailSender, OtpStore
- `BookingHandler` — **Dependency** on DatabaseConnection, EmailSender
- `DatabaseConnection` — **Dependency** used by all DAO and Handler classes
- `Service` and `Worker` — **Composition** (Service cannot exist without Worker)
- `Booking` — **Association** between Customer and Worker (M:N resolved)


---

## 6. UML Class Diagram

*(See attached draw.io XML file — import into app.diagrams.net for the visual diagram)*

Key elements shown in the diagram:
- Abstract class `User` with all attributes and the abstract method
- `Worker`, `Customer`, `Admin` as subclasses with inheritance arrows
- `Booking`, `Message`, `Rating`, `Service` as associated classes
- `DatabaseConnection`, `UserDAO`, `WorkerDAO`, `CustomerDAO` utility/DAO classes
- `EmailSender`, `OtpStore` utility classes
- All attributes, methods, and relationship types labeled

---

## 7. Functional Requirements

### Data Entry and Management
- Register new users (Customer or Worker) with full profile information
- Admin can delete users; deletion cascades to all related records
- Workers can update their profile; customers can update personal details

### Search and Retrieval
- Customer can view all APPROVED workers filtered by category or city
- Customer can view full worker profile including services offered and past reviews
- Admin can search and view all workers (approved, pending, rejected) and all customers

### Booking Management
- Create bookings with three types: NORMAL (immediate), ADVANCE (scheduled date), URGENT (high priority)
- Worker can accept or reject any PENDING booking
- Booking status lifecycle: PENDING → ACCEPTED / REJECTED → COMPLETED

### Reporting and Output
- Admin dashboard shows: total customers, approved workers, pending workers, total bookings
- Workers see all their bookings with customer details and status
- Customers see their full booking history

### Authentication
- Email + password login with role-based access control
- Forgot password via 6-digit OTP sent to email (expires in 10 minutes)
- OTP verified before password reset is allowed

### Communication
- In-app chat: customer and worker exchange messages stored in database
- Full conversation history retrievable by both parties

---

## 8. System Architecture

```
┌──────────────────────────────────────────────┐
│         FRONTEND (React Native / Expo)        │
│  Auth | Customer | Worker | Admin Screens     │
└───────────────────┬──────────────────────────┘
                    │  HTTP / JSON  (REST API)
                    │  POST http://192.168.x.x:8080/api/...
┌───────────────────▼──────────────────────────┐
│         BACKEND (Pure Java — No Framework)    │
│                                              │
│  API Layer:    AuthHandler, WorkerHandler,   │
│                BookingHandler, AdminHandler,  │
│                MessageHandler, UserHandler    │
│                                              │
│  DAO Layer:    UserDAO, WorkerDAO,           │
│                CustomerDAO                   │
│                                              │
│  Model Layer:  User, Worker, Customer,       │
│                Admin, Booking, Message,       │
│                Rating, Service               │
│                                              │
│  DB Layer:     DatabaseConnection (JDBC)     │
│                                              │
│  Utils Layer:  EmailSender, OtpStore,        │
│                IOUtils                       │
└───────────────────┬──────────────────────────┘
                    │  JDBC — MySQL Connector
┌───────────────────▼──────────────────────────┐
│         DATABASE (MySQL 8 — XAMPP)            │
│  12 Tables: users, workers, customers,        │
│  bookings, categories, services, messages,    │
│  ratings, notifications, audit_log, etc.      │
└───────────────────┬──────────────────────────┘
                    │  JavaMail (SSL port 465)
┌───────────────────▼──────────────────────────┐
│         EXTERNAL: Gmail SMTP Server           │
│  HTML email notifications for all events      │
└──────────────────────────────────────────────┘
```

### Module Interactions
- Frontend sends HTTP JSON requests to Backend API Layer
- API Layer parses requests, calls DAO Layer for database operations
- DAO Layer uses DatabaseConnection to run PreparedStatement SQL queries
- API Layer also calls EmailSender for notifications after key actions
- OtpStore is an in-memory store used only by AuthHandler for password reset flow


---

## 9. Implementation Plan (Java)

### Tools and Environment
- Language: Java JDK 17+ (project compiled with JDK 26)
- IDE: IntelliJ IDEA / VS Code
- Build Tool: Apache Maven 3.6+
- Database: MySQL 8 via XAMPP (phpMyAdmin for setup)
- Frontend: React Native with Expo SDK
- Email: JavaMail (javax.mail 1.6.2)

### Step-by-Step Development Plan

**Phase 1 — Database Setup**
Run `schema.sql` in phpMyAdmin to create all 12 tables, triggers, stored procedures, views, and seed data (categories + default admin account).

**Phase 2 — Model Classes**
Implement in this order: `User` (abstract) → `Worker` → `Customer` → `Admin` → `Booking` → `Message` → `Rating` → `Service` → `Category`

**Phase 3 — Database Layer**
Implement `DatabaseConnection.java` with static `getConnection()` method and JDBC MySQL driver setup.

**Phase 4 — DAO Layer**
Implement `UserDAO` (getUserByEmail, createUser) → `WorkerDAO` (createWorker) → `CustomerDAO` (createCustomer)

**Phase 5 — Utility Layer**
Implement `OtpStore` (ConcurrentHashMap with expiry) → `IOUtils` (read request body) → `EmailSender` (all 10 email types)

**Phase 6 — API Handlers**
Implement in order: `AuthHandler` → `WorkerHandler` → `BookingHandler` → `UserHandler` → `MessageHandler` → `AdminHandler`

**Phase 7 — Entry Point**
Implement `Main.java` — create HttpServer, register all route contexts, start server.

**Phase 8 — Frontend**
Build React Native screens: Auth screens → Customer screens → Worker Dashboard → Admin Dashboard. Connect to backend via `api.js`.

**Phase 9 — Testing**
Test all API endpoints using Postman. Run schema in MySQL and verify data. Test on physical Android device via Expo Go.

---

## 10. Expected Output

### System Behavior

The backend starts with:
```
Database connection verified.
HunarHub Backend started on port 8080
```

### Sample Input/Output

**Customer Registration:**
- Input: `{ "name": "Ali", "email": "ali@gmail.com", "password": "pass123", "role": "CUSTOMER", "city": "Lahore" }`
- Output: `{ "message": "Registration successful", "userId": 5 }`
- Side effect: Welcome email sent to ali@gmail.com

**Worker Login:**
- Input: `{ "email": "ahmad@gmail.com", "password": "pass123" }`
- Output: `{ "userId": 3, "name": "Ahmad", "role": "WORKER" }`
- Side effect: If pending bookings exist, summary email sent to worker

**Create Booking:**
- Input: `{ "customerId": 5, "workerId": 2, "type": "NORMAL" }`
- Output: `{ "message": "Booking created successfully", "bookingId": 12 }`
- Side effect: Email to customer (booking placed) + email to worker (new request)

**Admin Approves Worker:**
- Input: `{ "workerId": 3, "status": "APPROVED" }`
- Output: `{ "message": "Worker status updated to APPROVED" }`
- Side effect: Approval email sent to worker; worker now visible in search

**Password Reset:**
- User requests OTP → receives 6-digit code by email → verifies OTP → sets new password
- Output at each step: `{ "message": "OTP verified" }` → `{ "message": "Password reset successfully" }`

---

## 11. Challenges and Limitations

| Limitation | Details |
|---|---|
| No password hashing | Passwords stored as plain text. Should use BCrypt in production |
| No JWT authentication | No token-based session. Anyone with a userId can make requests |
| No real-time updates | Chat requires manual polling. No WebSocket or push notification support |
| No database connection pool | Each request opens its own JDBC connection. Slow under high load |
| Local network only | App works only on the same Wi-Fi. Requires port forwarding for internet access |
| IP-based URL | Frontend BASE_URL must be updated whenever the network IP changes |
| No input validation layer | Most validation is basic. No formal validation framework used |

---

## 12. Future Enhancements

| Enhancement | Description |
|---|---|
| BCrypt Password Hashing | Secure all passwords using one-way hashing |
| JWT Authentication | Stateless token-based login system |
| WebSocket Chat | Real-time bidirectional messaging (no polling) |
| Firebase Push Notifications | Instant booking alerts on phone |
| HikariCP Connection Pooling | Efficient database connection management |
| Payment Gateway | JazzCash / Stripe integration for in-app payments |
| GPS-Based Worker Search | Show nearest workers based on device location |
| Spring Boot Migration | Replace raw HttpServer with production-ready framework |
| Web Admin Panel | Full browser-based admin dashboard (React or Angular) |
| Cloud Deployment | Host backend on AWS / Railway with a public domain |
| AI Worker Recommendation | Suggest best workers based on rating, location, and history |
| Mobile App Store Release | Build and publish to Google Play Store |

---

*Project: HunarHub | Course: OOP (AI) | NUTECH | 2nd Semester*
