# OOP Assignment 6 — Final Project Design & Implementation Plan

**Course:** Object-Oriented Programming
**Semester:** 2nd Semester
**Project Title:** HunarHub — Local Service Hiring Platform

---

## 1. Project Title (Finalized)

**HunarHub — Local Service Hiring Platform**

A full-stack mobile application that connects customers with verified local skilled workers (Plumbers, Electricians, Painters, Mechanics, Carpenters, etc.) in Pakistan. Built entirely in Core Java with no frameworks — pure OOP architecture.

---

## 2. Problem Statement (Refined Version)

In Pakistan, millions of households face a daily challenge: finding reliable, verified skilled workers (plumbers, electricians, painters, mechanics) is time-consuming, risky, and dependent on word-of-mouth. There is no structured platform for discovering, booking, and reviewing local workers.

**Real-world Problem:** Customers waste hours searching for workers, often hiring unverified individuals with no accountability. Workers, on the other hand, have no digital presence and rely entirely on informal referrals.

**Target Users:**
- **Customers** — households needing services (booking, chatting with workers, rating them)
- **Workers** — skilled professionals wanting to register, get approved, and receive bookings
- **Admin** — platform manager who approves workers, monitors bookings, and manages users

**HunarHub** solves this by providing a structured, role-based mobile platform with booking management, real-time chat, worker approval flow, rating system, and automated email notifications.

---

## 3. System Overview (Final Design)

### How the system works end-to-end:

1. A **Customer** or **Worker** registers via the mobile app
2. **Workers** go through an admin approval process (PENDING → APPROVED/REJECTED)
3. **Customers** browse approved workers by category/city, view profiles, and place bookings
4. **Workers** receive booking notifications (email + app), and accept or reject them
5. **Customers** track booking status, chat with their worker, and rate them after completion
6. **Admin** manages all users, approves/rejects workers, and views dashboard statistics

### Final Modules:
| Module | Functionality |
|---|---|
| Auth Module | Register, Login, Forgot Password (OTP via email), Reset Password |
| Worker Module | Browse workers, view profiles, filter by category/city |
| Booking Module | Create/manage bookings (NORMAL, ADVANCE, URGENT types) |
| Chat Module | Real-time messaging between customer and worker |
| Rating Module | Customer rates worker after job completion |
| Admin Module | Dashboard stats, approve/reject workers, manage users/bookings |
| Email Module | Automated HTML emails for all lifecycle events |

### Input/Output Flow:
- **Input:** User registration data, booking requests, chat messages, rating scores, admin decisions
- **Output:** JSON responses from backend, email notifications, booking status updates, filtered worker lists

---

## 4. System Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React Native / Expo)              │
│  Auth Screens │ Customer Screens │ Worker Screens │ Admin │
└─────────────────────┬───────────────────────────────────┘
                       │  HTTP/JSON (REST API)
                       │  BASE_URL: http://<IP>:8080/api
┌─────────────────────▼───────────────────────────────────┐
│           BACKEND (Pure Java — Core OOP)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Layer (Handlers)                │   │
│  │  AuthHandler │ WorkerHandler │ BookingHandler    │   │
│  │  AdminHandler │ MessageHandler │ UserHandler     │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │              DAO Layer (Data Access)             │   │
│  │       UserDAO │ WorkerDAO │ CustomerDAO          │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │           Database Layer (JDBC)                  │   │
│  │           DatabaseConnection.java                │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │              Utility Layer                       │   │
│  │       EmailSender │ OtpStore │ IOUtils           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                       │  JDBC (MySQL Connector)
┌─────────────────────▼───────────────────────────────────┐
│              DATABASE (MySQL 8 — XAMPP)                  │
│  users │ workers │ customers │ bookings │ categories     │
│  messages │ ratings │ services │ notifications           │
└─────────────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────┐
│           EXTERNAL SERVICE (Gmail SMTP)                  │
│              JavaMail — HTML Email Notifications         │
└─────────────────────────────────────────────────────────┘
```

### Module Breakdown:
- **Models Package** — POJOs representing domain entities (User, Worker, Customer, Admin, Booking, etc.)
- **DAO Package** — Database interaction classes (CRUD operations using JDBC)
- **API Package** — HTTP request handlers routing REST endpoints
- **DB Package** — Single connection utility (DatabaseConnection)
- **Utils Package** — Cross-cutting utilities (email, OTP, I/O)

---

## 5. Detailed OOP Design

### 5.1 Classes and Objects (Final List)

| Class | Type | Package | Responsibility |
|---|---|---|---|
| `User` | Abstract Class | models | Base entity for all user types. Holds common fields (id, name, email, password, phone, dob, city, role). Declares abstract `getRoleDescription()` |
| `Worker` | Concrete Class extends User | models | Adds worker-specific fields: cnic, whatsapp, category, approvalStatus, rating. Overrides `getRoleDescription()` |
| `Customer` | Concrete Class extends User | models | Adds customerId. Overrides `getRoleDescription()` |
| `Admin` | Concrete Class extends User | models | Platform administrator role. Overrides `getRoleDescription()` |
| `Booking` | POJO | models | Represents a service booking with type (NORMAL/ADVANCE/URGENT) and status lifecycle |
| `Message` | POJO | models | Represents a chat message between sender and receiver |
| `Rating` | POJO | models | Customer's star rating and review for a worker per booking |
| `Service` | POJO | models | A service offered by a worker (weak entity — depends on worker) |
| `Category` | POJO | models | Service categories (Plumber, Electrician, etc.) |
| `DatabaseConnection` | Utility Class | db | Singleton-style static factory for JDBC connections |
| `UserDAO` | DAO Class | dao | getUserByEmail(), createUser() — handles users table |
| `WorkerDAO` | DAO Class | dao | createWorker(), resolves category name to ID |
| `CustomerDAO` | DAO Class | dao | createCustomer() — handles customers table |
| `AuthHandler` | Handler (inner static classes) | api | RegisterHandler, LoginHandler, ForgotPasswordHandler, VerifyOtpHandler, ResetPasswordHandler |
| `WorkerHandler` | Handler | api | GET all workers, GET worker by ID, filter by category/city |
| `BookingHandler` | Handler | api | Create booking, update status, get bookings by customer/worker |
| `AdminHandler` | Handler (inner static classes) | api | Stats, pending workers, approve/reject, delete user, all bookings |
| `MessageHandler` | Handler | api | Send and retrieve messages between users |
| `UserHandler` | Handler | api | Get/update user profile |
| `EmailSender` | Utility Class | utils | Sends HTML emails via Gmail SMTP for all lifecycle events |
| `OtpStore` | Utility Class | utils | In-memory thread-safe OTP storage with 10-minute expiry |
| `IOUtils` | Utility Class | utils | Reads HTTP request body as string |
| `Main` | Entry Point | root | Starts HttpServer on port 8080, registers all endpoint contexts |

### 5.2 UML Class Diagram

```
                        ┌──────────────────────────────────┐
                        │          <<abstract>>            │
                        │              User                │
                        ├──────────────────────────────────┤
                        │ # id: int                        │
                        │ # name: String                   │
                        │ # email: String                  │
                        │ # password: String               │
                        │ # phone: String                  │
                        │ # dob: Date                      │
                        │ # city: String                   │
                        │ # addressStreet: String          │
                        │ # addressZip: String             │
                        │ # role: String                   │
                        ├──────────────────────────────────┤
                        │ + getId(): int                   │
                        │ + getName(): String              │
                        │ + getEmail(): String             │
                        │ + getPassword(): String          │
                        │ + getRole(): String              │
                        │ + setters for all fields         │
                        │ + getRoleDescription(): String   │ <<abstract>>
                        └──────────────┬───────────────────┘
                                       │ extends
              ┌────────────────────────┼───────────────────────┐
              │                        │                       │
   ┌──────────▼──────────┐  ┌──────────▼──────────┐  ┌────────▼────────────┐
   │       Worker        │  │      Customer       │  │       Admin         │
   ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
   │ - workerId: int     │  │ - customerId: int   │  │ (no extra fields)   │
   │ - cnic: String      │  ├─────────────────────┤  ├─────────────────────┤
   │ - whatsapp: String  │  │ + getCustomerId()   │  │ + getRoleDesc..()   │
   │ - category: String  │  │ + setCustomerId()   │  └─────────────────────┘
   │ - approvalStatus    │  │ + getRoleDesc..()   │
   │ - rating: float     │  └─────────┬───────────┘
   ├─────────────────────┤            │ places
   │ + getWorkerId()     │            │
   │ + getCnic()         │   ┌────────▼────────────────────┐
   │ + getCategory()     │   │          Booking            │
   │ + getRating()       │   ├─────────────────────────────┤
   │ + getApprovalStatus │   │ - bookingId: int            │
   │ + getRoleDesc..()   │   │ - customerId: int           │
   └─────────┬───────────┘   │ - workerId: int             │
             │ receives      │ - serviceId: int            │
             └──────────────►│ - type: String              │
                             │ - bookingDate: Date         │
                             │ - status: String            │
                             ├─────────────────────────────┤
                             │ + getters / setters         │
                             └─────────────────────────────┘

   ┌─────────────────────┐   ┌─────────────────────────────┐
   │       Rating        │   │          Message            │
   ├─────────────────────┤   ├─────────────────────────────┤
   │ - ratingId: int     │   │ - messageId: int            │
   │ - customerId: int   │   │ - senderId: int             │
   │ - workerId: int     │   │ - receiverId: int           │
   │ - stars: int (1-5)  │   │ - text: String              │
   │ - review: String    │   │ - timestamp: Date           │
   │ - createdAt: Date   │   ├─────────────────────────────┤
   ├─────────────────────┤   │ + getters / setters         │
   │ + getters / setters │   └─────────────────────────────┘
   └─────────────────────┘

   ┌─────────────────────┐   ┌─────────────────────────────┐
   │   DatabaseConnection│   │        EmailSender          │
   ├─────────────────────┤   ├─────────────────────────────┤
   │ - DB_URL: String    │   │ - SMTP_HOST: String         │
   │ - DB_USER: String   │   │ - EMAIL_USERNAME: String    │
   │ - DB_PASSWORD:String│   │ - EMAIL_PASSWORD: String    │
   ├─────────────────────┤   ├─────────────────────────────┤
   │ + getConnection()   │   │ + sendWelcomeCustomer()     │
   │   : Connection      │   │ + sendWelcomeWorker()       │
   └─────────────────────┘   │ + sendWorkerApproved()      │
                             │ + sendBookingPlaced..()     │
   ┌─────────────────────┐   │ + sendPasswordResetOtp()    │
   │      OtpStore       │   └─────────────────────────────┘
   ├─────────────────────┤
   │ - store: Map<>      │   ┌─────────────────────────────┐
   │ - EXPIRY_MS: long   │   │         UserDAO             │
   ├─────────────────────┤   ├─────────────────────────────┤
   │ + put(email, otp)   │   │ + getUserByEmail(): User    │
   │ + verify(): boolean │   │ + createUser(): int         │
   │ + has(): boolean    │   └─────────────────────────────┘
   └─────────────────────┘
                             ┌─────────────────────────────┐
                             │        WorkerDAO            │
                             ├─────────────────────────────┤
                             │ + createWorker(): int       │
                             └─────────────────────────────┘
```

---

## 6. OOP Principles Implementation Mapping

### 6.1 Encapsulation — Data Hiding with Getters/Setters

All model classes use `private`/`protected` fields with public getters and setters. No field is directly accessible from outside.

```java
// User.java — all fields protected, accessed only via methods
public class User {
    protected String email;     // hidden
    protected String password;  // hidden

    public String getEmail()          { return email; }
    public void   setEmail(String e)  { this.email = e; }
    public String getPassword()       { return password; }
    public void   setPassword(String p) { this.password = p; }
}
```

Database credentials are also encapsulated inside `DatabaseConnection` as `private static final` constants — never exposed outside the class.

---

### 6.2 Inheritance — Parent-Child Class Relationships

`User` is the abstract parent. `Worker`, `Customer`, and `Admin` all extend it, inheriting common fields and behaviour while adding their own specialized state.

```java
// Worker.java — inherits all User fields + adds worker-specific ones
public class Worker extends User {
    private String cnic;
    private String category;
    private String approvalStatus;
    private float  rating;

    public Worker(...) {
        super(id, name, email, password, phone, dob, city, "WORKER");
        this.cnic     = cnic;
        this.category = category;
    }
}

// Customer.java — same inheritance pattern
public class Customer extends User {
    private int customerId;

    public Customer(...) {
        super(id, name, email, password, phone, dob, city, "CUSTOMER");
        this.customerId = customerId;
    }
}
```

---

### 6.3 Polymorphism — Method Overriding

`User` declares `getRoleDescription()` as abstract. Every subclass provides its own implementation. The same method call returns different output depending on the actual object type at runtime.

```java
// User.java — abstract declaration
public abstract String getRoleDescription();

// Worker.java — override
@Override
public String getRoleDescription() {
    return "Worker - Provides services (" + category + ") to customers.";
}

// Customer.java — override
@Override
public String getRoleDescription() {
    return "Customer - Searches for and books workers for services.";
}

// Admin.java — override
@Override
public String getRoleDescription() {
    return "System Administrator - Manages workers, customers, and bookings.";
}

// Runtime polymorphism example in AuthHandler:
User user = userDAO.getUserByEmail(email);  // could be Worker, Customer, or Admin
System.out.println(user.getRoleDescription()); // correct subclass method called
```

Anonymous inner class polymorphism is also used in `UserDAO` and `AuthHandler` when creating inline `User` instances:

```java
User newUser = new User(0, name, email, password, phone, dobDate, city, role) {
    @Override
    public String getRoleDescription() { return role; }
};
```

---

### 6.4 Abstraction — Abstract Classes and Interfaces

`User` is declared `abstract` — you cannot instantiate it directly. It defines the contract that all user types must fulfil. This hides implementation complexity from the consumer.

```java
public abstract class User {
    // Hides internal fields behind abstract contract
    public abstract String getRoleDescription(); // forced implementation
}

// Cannot do this — compile error:
User u = new User(...); // ERROR: User is abstract

// Must use concrete subclass:
User u = new Worker(...); // OK
User u = new Customer(...); // OK
```

`HttpHandler` (from Java's standard library `com.sun.net.httpserver`) is an **interface** that all API handlers implement, providing a clean abstraction over HTTP request handling:

```java
public class RegisterHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // concrete HTTP handling logic
    }
}
```

---

## 7. Key Functional Modules

### 7.1 Auth Module
- **Register** — validates input, creates User + Worker/Customer record, sends welcome email
- **Login** — verifies credentials, returns userId + role; on worker login, sends pending bookings summary email
- **Forgot Password** — generates 6-digit OTP, stores in-memory with 10-min expiry, emails it
- **Verify OTP** — validates OTP, marks email as VERIFIED in OtpStore
- **Reset Password** — updates password in DB after OTP verification

### 7.2 Worker Module
- Browse all APPROVED workers with category, city, rating
- Filter workers by category or city
- View detailed worker profile

### 7.3 Booking Module
- Create booking (NORMAL / ADVANCE / URGENT) → sends email to both customer and worker
- Worker accepts or rejects → customer gets email notification
- Mark booking COMPLETED → customer gets rating prompt email
- Customer/Worker can view their bookings with full status history

### 7.4 Chat Module
- Customer and Worker exchange messages via in-app chat
- Messages stored in `messages` table with sender/receiver IDs
- Full chat history retrievable by conversation pair

### 7.5 Rating Module
- Customer submits star rating (1–5) + text review after booking completion
- Database trigger automatically recalculates worker's average rating

### 7.6 Admin Module
- Dashboard: total customers, workers, bookings, revenue, pending approvals
- Approve/Reject workers → triggers approval/rejection email to worker
- View all users, bookings; delete users

### 7.7 Email Module (`EmailSender.java`)
- HTML emails for: welcome (customer/worker), approval, rejection, booking placed, booking accepted/rejected/completed, password reset OTP
- Uses Gmail SMTP via JavaMail on SSL port 465
- All sends are non-fatal — failure logs to console without crashing the server

---

## 8. Tools, Technologies & Development Plan

| Component | Technology |
|---|---|
| Language | Core Java (JDK 17+, tested on JDK 26) |
| Frontend | React Native, Expo SDK, React Navigation v6 |
| Backend HTTP | `com.sun.net.httpserver.HttpServer` (built into JDK) |
| Database | MySQL 8 via XAMPP, JDBC (`mysql-connector-java 8.0.33`) |
| JSON Parsing | `org.json` library |
| Email | JavaMail (`javax.mail` 1.6.2) via Gmail SMTP |
| Build Tool | Apache Maven 3.6+ |
| IDE | IntelliJ IDEA / VS Code |
| Mobile Dev | Expo Go app for live testing on physical device |
| Version Control | Git + GitHub (`github.com/msaad-20007/HunarHub`) |

### Development Approach:
1. Database schema design (3NF, triggers, stored procedures)
2. Model classes (User hierarchy, POJOs)
3. DAO layer (JDBC queries)
4. API handlers (HTTP routing + business logic)
5. Frontend screens (auth → customer flow → worker flow → admin)
6. Email integration and testing
7. End-to-end integration and bug fixing

---

## 9. Implementation Strategy

### Phase 1 — Core Infrastructure
- DatabaseConnection, schema.sql (all 12 tables + triggers)
- Abstract User class and all subclasses (Worker, Customer, Admin)

### Phase 2 — Auth System
- UserDAO, WorkerDAO, CustomerDAO
- AuthHandler (Register, Login, OTP flow)
- OtpStore, EmailSender (welcome emails)

### Phase 3 — Core Features
- WorkerHandler (browse, filter, profile)
- BookingHandler (create, accept/reject, complete)
- Email notifications for booking lifecycle

### Phase 4 — Additional Features
- MessageHandler (chat system)
- AdminHandler (dashboard, approvals, user management)
- Rating system with database trigger

### Phase 5 — Frontend
- Auth screens (Login, Signup, Forgot Password)
- Customer screens (Home, Search, Booking, Chat, Profile)
- Worker screens (Dashboard, Bookings, Profile)
- Admin Dashboard

### Class Development Order:
`User` → `Worker/Customer/Admin` → `Booking/Message/Rating` → `DatabaseConnection` → `UserDAO/WorkerDAO/CustomerDAO` → `AuthHandler` → `WorkerHandler/BookingHandler` → `AdminHandler/MessageHandler` → `EmailSender/OtpStore`

### Testing Strategy:
- API endpoints tested with Postman (manual HTTP testing)
- Database queries validated in phpMyAdmin
- Frontend tested live on physical Android device via Expo Go
- Edge cases: duplicate email registration, expired OTP, invalid booking status transitions

---

## 10. Expected Output / System Behavior

### Backend Startup:
```
✅ Database connection verified.
✅ HunarHub Backend started on port 8080
```

### Sample Input/Output:

**Register Customer:**
```
POST /api/auth/register
Input:  { "name":"Ali", "email":"ali@gmail.com", "password":"pass123",
          "phone":"03001234567", "city":"Lahore", "role":"CUSTOMER" }
Output: { "message": "Registration successful", "userId": 5 }
```

**Login:**
```
POST /api/auth/login
Input:  { "email":"ali@gmail.com", "password":"pass123" }
Output: { "message":"Login successful", "userId":5, "name":"Ali", "role":"CUSTOMER" }
```

**Get Workers:**
```
GET /api/workers
Output: [ { "workerId":1, "name":"Ahmad", "category":"Plumber",
            "city":"Lahore", "rating":4.5, "approvalStatus":"APPROVED" }, ... ]
```

**Place Booking:**
```
POST /api/bookings
Input:  { "customerId":5, "workerId":1, "type":"NORMAL", "bookingDate":"2025-06-10" }
Output: { "message":"Booking created", "bookingId":12 }
// → Email sent to customer (booking placed)
// → Email sent to worker (new booking request)
```

**System is REST API-based** — frontend (React Native) communicates via HTTP/JSON. Users interact through a mobile app UI with dark-themed screens, gradient buttons, and real-time feedback.

---

## 11. Limitations (Initial Design Stage)

| Limitation | Detail |
|---|---|
| No JWT Authentication | Login returns userId directly — no token-based session security |
| Plain-text Passwords | Passwords stored as plain text — no hashing (bcrypt not implemented) |
| No real-time push | Chat and booking updates require manual refresh — no WebSocket/FCM |
| Single database connection | No connection pool — each request opens/closes its own connection |
| No payment integration | No payment gateway — booking is confirmed without payment processing |
| Email enumeration risk | Forgot password reveals whether email exists (partially mitigated) |
| Local network only | App only works on local Wi-Fi — no public deployment |

---

## 12. Future Enhancements

| Enhancement | Description |
|---|---|
| Password Hashing | Implement BCrypt for secure password storage |
| JWT Token Auth | Stateless authentication using JSON Web Tokens |
| WebSocket Chat | Real-time bidirectional messaging instead of polling |
| FCM Push Notifications | Firebase Cloud Messaging for instant mobile alerts |
| Connection Pooling | HikariCP for efficient database connection management |
| Payment Gateway | JazzCash / EasyPaisa / Stripe integration for in-app payments |
| GPS Location | Show nearby workers based on GPS coordinates |
| Worker Portfolio | Workers upload photos of past work |
| Web Dashboard | Admin panel as a web app (React or Angular) |
| AI Matching | Recommend best workers based on rating, location, and past bookings |
| Cloud Deployment | Deploy backend on AWS EC2 / Railway with public IP |
| Spring Boot Migration | Replace raw HttpServer with Spring Boot for production readiness |
