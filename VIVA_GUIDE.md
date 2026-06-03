# HunarHub — Complete Viva Guide & Code Understanding
### From Zero to Expert — Every Concept Explained

---

## TABLE OF CONTENTS
1. What is HunarHub? (30-second pitch)
2. Project Architecture — The Big Picture
3. Backend Deep Dive — Phase by Phase
4. Frontend Deep Dive
5. Database Design
6. OOP Concepts — Real Code Examples
7. Data Flow — Request to Response
8. Email System
9. Common Errors & Fixes
10. VIVA QUESTIONS & ANSWERS (60+ Questions)

---

## 1. WHAT IS HUNARHUB? (Your 30-Second Pitch)

> "HunarHub is a mobile app that connects customers with verified local skilled
> workers like plumbers, electricians, and painters in Pakistan. A customer
> opens the app, browses workers, books one, chats with them, and rates them
> after the job. Workers register, wait for admin approval, then receive and
> manage bookings. The backend is pure Java with no frameworks — just core
> Java OOP, JDBC, and Java's built-in HTTP server. The frontend is React Native."

**Three user roles:**
- CUSTOMER — books workers
- WORKER — receives and accepts/rejects bookings
- ADMIN — approves workers, manages the platform


---

## 2. PROJECT ARCHITECTURE — THE BIG PICTURE

```
PHONE (React Native App)
        |
        |  HTTP/JSON  (REST API calls)
        |  e.g. POST http://192.168.100.6:8080/api/auth/login
        ↓
BACKEND (Pure Java — Main.java starts everything)
        |
        ├── API Layer    → AuthHandler, WorkerHandler, BookingHandler,
        |                  AdminHandler, MessageHandler, UserHandler
        |                  (These receive HTTP requests & send JSON back)
        |
        ├── DAO Layer    → UserDAO, WorkerDAO, CustomerDAO
        |                  (These talk to the database using JDBC)
        |
        ├── Model Layer  → User(abstract), Worker, Customer, Admin,
        |                  Booking, Message, Rating, Service, Category
        |                  (Plain Java objects = data containers)
        |
        ├── DB Layer     → DatabaseConnection.java
        |                  (Opens MySQL connection via JDBC)
        |
        └── Utils Layer  → EmailSender, OtpStore, IOUtils
                           (Helper tools used across the app)
        |
        ↓  JDBC (MySQL Connector JAR)
DATABASE (MySQL — XAMPP)
        |
        └── Tables: users, workers, customers, bookings,
                    categories, services, messages, ratings,
                    notifications, worker_skills,
                    user_phone_numbers, audit_log
        |
        ↓  JavaMail
GMAIL SMTP → Sends HTML emails for every event
```

**Key point:** No Spring Boot. No Hibernate. No Express. Everything is hand-written Java.


---

## 3. BACKEND DEEP DIVE — PHASE BY PHASE

### PHASE 1 — Entry Point: Main.java

`Main.java` is the FIRST file that runs. It does three things:
1. Tests the database connection
2. Creates an HTTP server on port 8080
3. Registers every URL route with its handler

```java
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.createContext("/api/auth/register", new AuthHandler.RegisterHandler());
server.createContext("/api/workers",       new WorkerHandler());
server.start();
```

Think of it like a switchboard. When a request comes in to `/api/workers`,
Java routes it to `WorkerHandler`. When it comes to `/api/auth/login`,
it goes to `AuthHandler.LoginHandler`.

---

### PHASE 2 — Model Classes (The Data Containers)

These are Plain Old Java Objects (POJOs). They hold data, nothing more.

**User.java** — ABSTRACT parent class
```java
public abstract class User {
    protected int id;
    protected String name, email, password, phone, city, role;
    // abstract method — MUST be overridden by every subclass
    public abstract String getRoleDescription();
}
```
Why abstract? Because a "User" alone doesn't make sense.
Every user is either a Worker, Customer, or Admin.

**Worker.java** — extends User, adds:
- `cnic` (ID card number)
- `category` (Plumber, Electrician, etc.)
- `approvalStatus` (PENDING / APPROVED / REJECTED)
- `rating` (average stars)

**Customer.java** — extends User, adds:
- `customerId` (separate PK from users table)

**Admin.java** — extends User, no extra fields, just overrides `getRoleDescription()`

**Booking.java** — completely independent POJO:
- `type`: NORMAL, ADVANCE, or URGENT
- `status`: PENDING → ACCEPTED/REJECTED → COMPLETED

**Message.java** — senderId, receiverId, text, timestamp

**Rating.java** — customerId, workerId, stars (1-5), review text


---

### PHASE 3 — Database Layer: DatabaseConnection.java

```java
public class DatabaseConnection {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/hunarhub...";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "";  // XAMPP default

    public static Connection getConnection() throws SQLException {
        Class.forName("com.mysql.cj.jdbc.Driver"); // loads the MySQL driver
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }
}
```

**Key points:**
- Constructor is `private` — you can't do `new DatabaseConnection()`
- `getConnection()` is `static` — call it as `DatabaseConnection.getConnection()`
- Returns a NEW connection each time — caller must close it
- Always used with try-with-resources: `try (Connection conn = DatabaseConnection.getConnection())`
  so it closes automatically even if an exception occurs

---

### PHASE 4 — DAO Layer (Database Access Objects)

DAOs are the only classes that write SQL. They take model objects and save/fetch them.

**UserDAO.java** has two methods:

`getUserByEmail(String email)` — runs:
```sql
SELECT * FROM users WHERE email = ?
```
Returns a User object (anonymous subclass with inline getRoleDescription).

`createUser(User user)` — runs:
```sql
INSERT INTO users (name, email, password, phone, dob, address_city, ..., role)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```
Returns the auto-generated `id` using `Statement.RETURN_GENERATED_KEYS`.

**WorkerDAO.java** — `createWorker(Worker worker)`:
1. First looks up the category name to get its ID:
   `SELECT category_id FROM categories WHERE category_name = ?`
2. Then inserts into workers table with that ID.
   Why? Because the workers table stores `category_id` (FK), not the name.

**CustomerDAO.java** — `createCustomer(Customer customer)`:
Simple insert: `INSERT INTO customers (user_id) VALUES (?)`

**Why use `?` instead of string concatenation?**
`?` = PreparedStatement = parameterized query = prevents SQL Injection.
Never do: `"WHERE email = '" + email + "'"` — that's dangerous.


---

### PHASE 5 — API Handlers (The Heart of the Backend)

Every handler implements `HttpHandler` interface from Java's built-in library.
That interface has ONE method: `void handle(HttpExchange exchange)`

`HttpExchange` = the HTTP conversation. It has:
- `exchange.getRequestMethod()` → "GET", "POST", "PUT"
- `exchange.getRequestURI().getPath()` → "/api/workers/5"
- `exchange.getRequestBody()` → the JSON body sent by frontend
- `exchange.getResponseHeaders()` → set Content-Type, CORS headers
- `exchange.sendResponseHeaders(statusCode, bodyLength)`
- `exchange.getResponseBody()` → OutputStream to write JSON back

**CORS Headers** — every handler adds these:
```java
exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
```
This allows the React Native app to call the backend from a different IP.
Without this, the browser/app blocks the response.

---

#### AuthHandler.java — 5 inner static classes

Each inner class handles one endpoint:

**RegisterHandler** (`POST /api/auth/register`):
1. Read JSON body → extract name, email, password, role, etc.
2. Check if email already exists → if yes, return 400
3. Create User object → call `userDAO.createUser()`
4. If WORKER → also call `workerDAO.createWorker()`
5. If CUSTOMER → also call `customerDAO.createCustomer()`
6. Send welcome email
7. Return `{ "message": "Registration successful", "userId": 5 }`

**LoginHandler** (`POST /api/auth/login`):
1. Get email + password from JSON
2. Call `userDAO.getUserByEmail(email)`
3. Compare password (plain text comparison — no hashing)
4. If worker → fetch their pending bookings and email them a summary
5. Return userId, name, role

**ForgotPasswordHandler** (`POST /api/auth/forgot-password`):
1. Find user by email
2. Generate 6-digit OTP: `String.format("%06d", rng.nextInt(1_000_000))`
3. Store in `OtpStore.put(email, otp)` (in-memory, expires in 10 min)
4. Send OTP email
5. Always return 200 (even if email not found — prevents email enumeration)

**VerifyOtpHandler** (`POST /api/auth/verify-otp`):
1. Call `OtpStore.verify(email, otp)`
2. If valid → put "VERIFIED" token: `OtpStore.put(email, "VERIFIED")`
3. Now reset-password can proceed

**ResetPasswordHandler** (`POST /api/auth/reset-password`):
1. Check `OtpStore.verify(email, "VERIFIED")`
2. Run: `UPDATE users SET password = ? WHERE LOWER(email) = ?`
3. Return success


---

#### WorkerHandler.java

Handles `GET /api/workers` and `GET /api/workers/{id}`

**Get All Workers:**
```sql
SELECT u.id, u.name, u.address_city AS city, u.phone,
       w.worker_id, c.category_name AS category, w.rating, w.whatsapp
FROM users u
JOIN workers w ON u.id = w.user_id
JOIN categories c ON w.category_id = c.category_id
WHERE w.approval_status = 'APPROVED'
ORDER BY w.rating DESC
```
This is a 3-table JOIN. Only APPROVED workers are shown.

**Get Worker By ID** — same join + also fetches:
- Their services list
- Their last 5 reviews (with customer names)

---

#### BookingHandler.java

Routes ALL /api/bookings/* internally using path inspection:
```java
if ("POST".equals(method) && path.equals("/api/bookings"))        → createBooking
if ("GET".equals(method)  && path.startsWith("/api/bookings/customer/")) → getByCustomer
if ("GET".equals(method)  && path.startsWith("/api/bookings/worker/"))   → getByWorker
if ("PUT".equals(method)  && path.matches("/api/bookings/\\d+/status"))  → updateStatus
```

**Create Booking flow:**
1. Validate worker is APPROVED
2. Resolve customer_id from users.id (two different PKs!)
3. INSERT into bookings with status='PENDING'
4. Email worker: "New booking request"
5. Email customer: "Booking placed, awaiting response"

**Update Status flow (Worker accepts/rejects/completes):**
1. `UPDATE bookings SET status = ? WHERE booking_id = ?`
2. Based on new status → send different email to customer:
   - ACCEPTED → "Your worker is coming!"
   - REJECTED → "Sorry, find another worker"
   - COMPLETED → "Rate your worker"

---

#### AdminHandler.java — 7 inner static classes

- `StatsHandler` → 4 COUNT queries for dashboard numbers
- `PendingWorkersHandler` → workers WHERE approval_status='PENDING'
- `AllWorkersHandler` → all workers ordered by status
- `AllCustomersHandler` → all customers with user join
- `ApproveWorkerHandler` → UPDATE workers SET approval_status=? + email
- `DeleteUserHandler` → DELETE FROM users WHERE id=? (CASCADE deletes everything)
- `AllBookingsHandler` → all bookings with LEFT JOINs (so deleted users don't break it)

---

#### MessageHandler.java

`GET /api/messages?user1=X&user2=Y` — fetches conversation:
```sql
SELECT ... FROM messages m JOIN users u ON m.sender_id = u.id
WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
ORDER BY sent_at ASC
```

`POST /api/messages` — saves a message + returns it immediately with timestamp.
This is how the chat screen shows your own message right away.


---

## 4. FRONTEND DEEP DIVE

### App.js — Root File
```javascript
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />   // everything is inside AppNavigator
    </SafeAreaProvider>
  );
}
```

### AppNavigator.js — The Brain of Frontend

Does two things on startup:
1. Checks `AsyncStorage` for saved `userRole`
2. Shows `SplashScreen` first, then routes to correct screen stack

**Three screen stacks based on role:**
```javascript
userRole === null     → Landing, Login, Signup, ForgotPassword
userRole === 'CUSTOMER' → CustomerHome, WorkerDetails, Booking, Chat, Profile, Search
userRole === 'WORKER'   → WorkerDashboard
userRole === 'ADMIN'    → AdminDashboard
```

**AsyncStorage** = phone's local key-value storage (like localStorage in browser).
Used to remember the logged-in user's role across app restarts.

### AuthContext.js — Shared State

```javascript
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
```

`AuthContext` stores `userRole` and `updateUserRole`.
When login succeeds: `updateUserRole('CUSTOMER')` → saves to AsyncStorage → triggers
navigation to re-render → customer screen stack appears automatically.
When logout: `updateUserRole(null)` → back to auth screens.

### api.js — All Backend Calls

Single `apiCall()` function handles everything:
```javascript
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};
```

Organized into API groups:
- `authAPI` → login, register, forgotPassword, verifyOtp, resetPassword
- `workerAPI` → getAll, getById
- `bookingAPI` → create, getByCustomer, getByWorker, updateStatus
- `messageAPI` → getConversation, send
- `adminAPI` → getStats, getPendingWorkers, approveWorker, deleteUser

### Screen Flow Summary

**Customer Journey:**
```
SplashScreen → LandingScreen → LoginScreen
   → CustomerHomeScreen (see categories + workers)
   → SearchScreen (filter by category/city)
   → WorkerDetailsScreen (profile, services, reviews)
   → BookingScreen (pick type, date → POST /api/bookings)
   → ChatScreen (messages with worker)
   → ProfileScreen (view/edit own profile)
```

**Worker Journey:**
```
SplashScreen → LoginScreen → WorkerDashboard
   (see pending bookings, accept/reject, view chat)
```

**Admin Journey:**
```
LoginScreen → AdminDashboard
   (stats, approve workers, manage users, view bookings)
```


---

## 5. DATABASE DESIGN

### 12 Tables Overview

| Table | Purpose |
|---|---|
| `users` | All users (ADMIN, WORKER, CUSTOMER) in one table |
| `workers` | Extra worker data — FK to users(id) |
| `customers` | Extra customer data — FK to users(id) |
| `categories` | Service types (Plumber, Electrician, etc.) |
| `services` | Services a worker offers — WEAK ENTITY (needs worker to exist) |
| `bookings` | M:N bridge between customers and workers |
| `ratings` | Customer reviews for workers |
| `messages` | Chat messages between users |
| `notifications` | System alerts per user |
| `worker_skills` | Multi-valued attribute — worker's skills list |
| `user_phone_numbers` | Multi-valued attribute — multiple phones per user |
| `audit_log` | Tracks all status changes automatically |

### Why is `users` one table for all roles?
This is called "Single Table Inheritance". All users share common fields
(name, email, password, phone). The `role` column (ADMIN/WORKER/CUSTOMER)
distinguishes them. Role-specific data goes in separate tables (workers, customers).

### Important: Two Different IDs for Workers
- `users.id` = the user's main ID (used for login, messages, etc.)
- `workers.worker_id` = the worker's booking ID

When booking, the frontend sends `workerId` (the workers.worker_id).
When messaging, it uses `users.id`.
This is why `BookingHandler` does a JOIN to get both.

### 3 Database Triggers

**Trigger 1** — Auto-update worker rating after new rating inserted:
```sql
AFTER INSERT ON ratings → UPDATE workers SET rating = AVG(stars) WHERE worker_id = NEW.worker_id
```

**Trigger 2** — Auto-increment total_jobs when booking completed:
```sql
AFTER UPDATE ON bookings → IF NEW.status = 'COMPLETED' → UPDATE workers SET total_jobs = total_jobs + 1
```

**Trigger 3** — Log every booking status change to audit_log:
```sql
AFTER UPDATE ON bookings → IF NEW.status != OLD.status → INSERT INTO audit_log(...)
```

### Why PreparedStatements?
```java
// SAFE — PreparedStatement
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);

// DANGEROUS — String concatenation (SQL Injection)
Statement s = conn.createStatement();
s.execute("SELECT * FROM users WHERE email = '" + email + "'");
// If email = "' OR '1'='1" → returns ALL users!
```


---

## 6. OOP CONCEPTS — REAL CODE EXAMPLES

### ENCAPSULATION
"Hide data, expose methods"

```java
// BAD — direct field access (no encapsulation)
user.password = "abc123"; // anyone can change it!

// GOOD — in User.java
protected String password;           // hidden
public String getPassword() { return password; }
public void setPassword(String p) { this.password = p; }
```

`DatabaseConnection` also uses encapsulation:
```java
private static final String DB_PASSWORD = ""; // NEVER public
```
The password is locked inside the class. No other class can read it directly.

---

### INHERITANCE
"Child class gets all parent's features + adds its own"

```
User (abstract)
├── Worker  → adds: cnic, category, approvalStatus, rating
├── Customer → adds: customerId
└── Admin   → no extra fields, just different role behavior
```

```java
// Worker gets all User fields automatically via super()
public Worker(int id, String name, ..., String category) {
    super(id, name, email, password, phone, dob, city, "WORKER"); // parent init
    this.category = category; // own init
}

// Worker can use parent methods directly
worker.getName();   // inherited from User
worker.getCity();   // inherited from User
worker.getCategory(); // own method
```

---

### POLYMORPHISM
"Same method name, different behavior depending on the object"

```java
// All three are declared as type User (parent)
User u1 = new Worker(...);
User u2 = new Customer(...);
User u3 = new Admin(...);

// Same method call → different output at RUNTIME
u1.getRoleDescription(); // "Worker - Provides services (Plumber)..."
u2.getRoleDescription(); // "Customer - Searches for workers..."
u3.getRoleDescription(); // "System Administrator - Manages..."
```

Also used in AuthHandler with anonymous class:
```java
User newUser = new User(0, name, email, password, ...) {
    @Override
    public String getRoleDescription() { return role; } // inline override
};
```
This creates a nameless subclass of User on the spot.

---

### ABSTRACTION
"Show only what's needed, hide complexity"

**Abstract class:**
```java
public abstract class User {
    public abstract String getRoleDescription(); // contract — subclass MUST implement
}
// You CANNOT do: new User(...) — compile error
// You CAN do: new Worker(...)
```

**Interface (HttpHandler):**
```java
// Java's built-in interface
public interface HttpHandler {
    void handle(HttpExchange exchange) throws IOException; // contract
}

// Our class fulfils the contract
public class WorkerHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) { ... } // implementation
}
```
Main.java only knows about `HttpHandler` interface — it doesn't care which
specific class it is. That's abstraction.


---

## 7. DATA FLOW — REQUEST TO RESPONSE

### Complete Booking Creation Flow (Most Important)

```
1. Customer taps "Book" in app
         ↓
2. BookingScreen calls:
   bookingAPI.create({ customerId:5, workerId:2, type:"NORMAL" })
         ↓
3. api.js sends:
   POST http://192.168.100.6:8080/api/bookings
   Body: {"customerId":5, "workerId":2, "type":"NORMAL", "scheduledAt":"2025-06-10 14:00"}
         ↓
4. Main.java → routes to BookingHandler
         ↓
5. BookingHandler.handleCreateBooking():
   a. Parse JSON body
   b. Check worker is APPROVED:
      SELECT approval_status FROM workers WHERE worker_id=2
   c. Resolve customer_id:
      SELECT customer_id FROM customers WHERE user_id=5
   d. INSERT INTO bookings (customer_id, worker_id, type, booking_date, status='PENDING')
   e. Get generated booking_id (e.g. 12)
   f. Fetch worker email + customer email
   g. EmailSender.sendNewBookingToWorker(...)    → email to worker
   h. EmailSender.sendBookingPlacedToCustomer(...) → email to customer
         ↓
6. Return to frontend:
   HTTP 201: {"message":"Booking created successfully","bookingId":12}
         ↓
7. App shows success screen
   Worker receives email notification
```

### Login Flow

```
1. User types email/password → taps Login
2. authAPI.login({email, password}) → POST /api/auth/login
3. AuthHandler.LoginHandler:
   - UserDAO.getUserByEmail(email) → queries DB
   - Compare password
   - If worker → fetch pending bookings → send summary email
   - Return: {userId:5, name:"Ali", role:"CUSTOMER"}
4. Frontend: AsyncStorage.setItem('userRole', 'CUSTOMER')
             AsyncStorage.setItem('userId', '5')
5. AppNavigator detects userRole change → switches to Customer screen stack
6. CustomerHome renders
```

### OTP Password Reset Flow

```
ForgotPassword Screen
   → POST /api/auth/forgot-password {email}
   → Backend: generates "123456", stores in OtpStore with timestamp
   → Email sent with OTP
   
OTP Screen
   → POST /api/auth/verify-otp {email, otp:"123456"}
   → Backend: OtpStore.verify() → checks match + not expired (10 min)
   → Stores "VERIFIED" marker in OtpStore
   
New Password Screen
   → POST /api/auth/reset-password {email, newPassword:"newpass"}
   → Backend: OtpStore.verify(email, "VERIFIED") → true
   → UPDATE users SET password='newpass' WHERE email=...
   → Done!
```


---

## 8. EMAIL SYSTEM — EmailSender.java

### How it works
Uses JavaMail library to send HTML emails via Gmail SMTP.

```java
// Connection setup
Properties props = new Properties();
props.put("mail.smtp.ssl.enable", "true");  // SSL encryption
props.put("mail.smtp.host", "smtp.gmail.com");
props.put("mail.smtp.port", "465");          // SSL port

// Authentication
Session session = Session.getInstance(props, new Authenticator() {
    protected PasswordAuthentication getPasswordAuthentication() {
        return new PasswordAuthentication(EMAIL_USERNAME, EMAIL_PASSWORD);
    }
});

// Send
Transport.send(message);
```

### Why port 465 not 587?
587 uses STARTTLS which ISPs in Pakistan often block. 465 uses SSL directly — more reliable.

### 9 Email Types in the system
1. `sendWelcomeCustomer` → when customer registers
2. `sendWelcomeWorker` → when worker registers (says "pending approval")
3. `sendWorkerApproved` → when admin approves a worker
4. `sendWorkerRejected` → when admin rejects a worker
5. `sendBookingPlacedToCustomer` → when customer places a booking
6. `sendNewBookingToWorker` → when a new booking comes to worker
7. `sendBookingAccepted` → when worker accepts
8. `sendBookingRejected` → when worker rejects
9. `sendBookingCompleted` → when booking is marked complete (with rating prompt)
10. `sendPasswordResetOtp` → OTP for forgot password

### Why "non-fatal"?
Every email send is wrapped in try-catch separately from the main logic.
If email fails → server logs the error but continues normally.
The booking still succeeds even if email fails.

### OtpStore.java
```java
private static final Map<String, Entry> store = new ConcurrentHashMap<>();
```
- `ConcurrentHashMap` = thread-safe map (multiple requests can access it simultaneously)
- Each entry has the OTP string + timestamp
- `verify()` checks: does it match? + is it < 10 minutes old?
- After successful verify → entry deleted (one-time use)


---

## 9. COMMON ERRORS & FIXES (Know These for Viva)

| Error | Cause | Fix |
|---|---|---|
| `UnsupportedClassVersionError: class file version 61.0` | Java runtime is older than compiler | Install JDK 17+ and update PATH |
| `Table 'hunarhub.categories' doesn't exist` | schema.sql not run in MySQL | Open phpMyAdmin → run schema.sql |
| `Database connection failed` | XAMPP MySQL not running OR wrong password | Start XAMPP MySQL → check DatabaseConnection.java |
| `Connection refused` on phone | Backend not running OR wrong IP in api.js | Start backend → check `ipconfig` → update BASE_URL |
| `Email already registered` (400) | User tried to register with existing email | Expected behavior — UserDAO checks before inserting |
| `Worker is not available for booking` (400) | Worker status is PENDING, not APPROVED | Admin must approve worker first |
| `Category not found` (WorkerDAO) | Category name in registration doesn't match DB | Category must match exactly: "Plumber", "Electrician", etc. |
| `mvn not recognized` | Maven not in PATH | Add Maven bin folder to system PATH |
| Port 8080 in use | Another process using 8080 | `netstat -ano \| findstr :8080` then `taskkill /PID <pid> /F` |

---

## 10. VIVA QUESTIONS & ANSWERS

---

### SECTION A: PROJECT OVERVIEW

**Q1: In one sentence, what does HunarHub do?**
It connects customers with verified local skilled workers through a mobile app,
allowing them to browse, book, chat, and rate workers.

**Q2: What technologies did you use?**
- Backend: Core Java (JDK 17+), com.sun.net.httpserver, JDBC, JavaMail
- Database: MySQL 8 (XAMPP), schema with 12 tables, 3 triggers, 2 stored procedures
- Frontend: React Native with Expo SDK, React Navigation v6
- Build: Apache Maven
- Email: Gmail SMTP via javax.mail on port 465

**Q3: Why did you not use Spring Boot?**
The assignment required pure Core Java OOP. Spring Boot is a framework that
auto-configures everything. We wanted to demonstrate we understand how HTTP
servers, JDBC, and OOP work from scratch.

**Q4: How many user roles are there and what can each do?**
Three roles:
- CUSTOMER: register, browse workers, create bookings, chat, rate
- WORKER: register (needs approval), view bookings, accept/reject, chat
- ADMIN: approve/reject workers, view all users/bookings, delete users, see stats

**Q5: How does the app know which screen to show after login?**
After login, the backend returns the user's `role`. The frontend stores it in
`AsyncStorage` (phone storage). `AppNavigator` reads this role and renders the
correct screen stack: Customer screens, Worker screens, or Admin dashboard.


---

### SECTION B: OOP CONCEPTS

**Q6: What are the four OOP pillars? Give one example from your project for each.**

- **Encapsulation:** `User.java` — all fields are `protected`, accessed only via getters/setters.
  `DatabaseConnection.java` — DB password is `private static final`, never exposed.

- **Inheritance:** `Worker extends User`, `Customer extends User`, `Admin extends User`.
  Worker inherits id, name, email, phone, city from User and adds cnic, category, rating.

- **Polymorphism:** `getRoleDescription()` is declared abstract in User.
  Worker, Customer, and Admin each override it with different behavior.
  At runtime: `User u = new Worker(...)` → `u.getRoleDescription()` calls Worker's version.

- **Abstraction:** `User` is `abstract` — cannot be instantiated directly.
  `HttpHandler` is an interface from Java's library — we implement it in all our handlers.

**Q7: Why is the User class abstract?**
Because a generic "User" has no meaning in our system. Every user is specifically
a Worker, Customer, or Admin. Making it abstract forces correct use — you cannot
accidentally create a plain User object.

**Q8: What is the difference between abstract class and interface?**
- Abstract class: can have fields, constructors, implemented methods + abstract methods.
  Used when classes share code (User has shared fields and constructor).
- Interface: only method signatures (in Java 7), no fields, no constructors.
  Used when unrelated classes need the same behavior (HttpHandler).

In our project: User = abstract class (shared state), HttpHandler = interface (shared behavior contract).

**Q9: What is method overriding? Show an example from your code.**
Overriding means a subclass provides its own version of a parent method.
```java
// Parent (abstract method)
public abstract String getRoleDescription(); // in User.java

// Child override
@Override
public String getRoleDescription() {         // in Worker.java
    return "Worker - Provides services (" + category + ") to customers.";
}
```
The `@Override` annotation tells the compiler to verify we're actually overriding.

**Q10: What is an anonymous class? Where did you use it?**
An anonymous class is a class defined and instantiated in one expression, with no name.
Used in `UserDAO.getUserByEmail()` and `AuthHandler.RegisterHandler`:
```java
User newUser = new User(0, name, email, ...) {
    @Override
    public String getRoleDescription() { return role; }
};
```
This is needed because User is abstract and we can't instantiate it directly,
but we need a quick User object without creating a named subclass for every case.

**Q11: What is encapsulation and why is it important?**
Encapsulation bundles data and the methods that operate on it, hiding internal state.
It's important because:
1. Prevents invalid state (e.g., you can validate in a setter before accepting a value)
2. Changes to internal implementation don't affect other classes
3. Improves security (DB password in DatabaseConnection is private — no class can read it)

**Q12: What is static in Java? Where did you use it?**
`static` means the member belongs to the class, not to instances. No object needed.
Used in:
- `DatabaseConnection.getConnection()` — static method, called as `DatabaseConnection.getConnection()`
- `OtpStore.put()`, `OtpStore.verify()` — static methods, OTP map is static (shared across all requests)
- `EmailSender.sendWelcomeCustomer()` — all email methods are static (utility class)
- `AdminHandler` helper `sendResponse()` — static since all inner classes use it


---

### SECTION C: JAVA & BACKEND CONCEPTS

**Q13: What is JDBC? How did you use it?**
JDBC (Java Database Connectivity) is Java's standard API to connect to databases.
We use it to connect to MySQL:
```java
Connection conn = DatabaseConnection.getConnection();  // open connection
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email=?");
ps.setString(1, email);     // bind parameter
ResultSet rs = ps.executeQuery(); // run query
while (rs.next()) {
    String name = rs.getString("name"); // read results
}
conn.close(); // close (or use try-with-resources)
```

**Q14: What is try-with-resources? Why do you use it?**
```java
try (Connection conn = DatabaseConnection.getConnection()) {
    // use conn
} // conn.close() called AUTOMATICALLY here, even if exception occurs
```
This ensures the database connection is always closed, preventing connection leaks.
Without it, open connections pile up and the database runs out of connections.

**Q15: What is PreparedStatement vs Statement?**
- `Statement` → executes raw SQL string. Vulnerable to SQL injection.
- `PreparedStatement` → uses `?` placeholders. Parameters set separately.
  Database treats parameter values as data, not SQL code.
  Also faster for repeated queries (pre-compiled by DB).

**Q16: What is SQL Injection? How do you prevent it?**
SQL Injection is an attack where a user inputs SQL code as data.
Example: email = `' OR '1'='1`
Dangerous query: `WHERE email = '' OR '1'='1'` → returns ALL users!
Prevention: PreparedStatement with `?` parameters — the `'` is escaped automatically.

**Q17: What is CORS and why do you need it?**
CORS (Cross-Origin Resource Sharing) is a browser/app security policy that blocks
requests from a different origin (IP/port) by default.
Our frontend (phone) calls backend (PC IP). Without CORS headers, the request is blocked.
Fix: add `Access-Control-Allow-Origin: *` to every response header.

**Q18: What is an inner class? Why did you use them in AuthHandler and AdminHandler?**
A class defined inside another class. In our code, `RegisterHandler`, `LoginHandler`,
etc. are inner static classes inside `AuthHandler`.
Benefits:
- Logical grouping — all auth-related handlers in one file
- Still each class implements `HttpHandler` separately
- `static` inner class means it doesn't need an instance of the outer class

**Q19: What is HttpExchange?**
It represents a single HTTP request-response transaction. It gives you:
- The incoming request (method, path, headers, body)
- The outgoing response (status code, headers, body)
Everything the handler needs to process a request is in one `HttpExchange` object.

**Q20: What is JSON and how do you use it in the project?**
JSON (JavaScript Object Notation) is the data format used between frontend and backend.
We use the `org.json` library:
```java
// Parse incoming JSON
JSONObject json = new JSONObject(requestBodyString);
String email = json.getString("email");

// Build outgoing JSON
JSONObject response = new JSONObject();
response.put("userId", 5);
response.put("role", "CUSTOMER");
sendResponse(exchange, 200, response.toString());
```


---

### SECTION D: DATABASE QUESTIONS

**Q21: What is normalization? Is your database normalized?**
Normalization is organizing tables to reduce redundancy and dependency.
Our schema follows 3NF (Third Normal Form):
- 1NF: No repeating groups. Multi-valued attributes (phone numbers, skills) in separate tables.
- 2NF: No partial dependencies. Every non-key column depends on the WHOLE primary key.
- 3NF: No transitive dependencies. Non-key columns depend only on the primary key, not on other non-key columns.
Example: category_name is in `categories` table, not repeated in `workers`.

**Q22: What are the three triggers in your database? What do they do?**
1. `trg_update_worker_rating_after_insert` — After a rating is inserted, automatically
   recalculates and updates the worker's average rating in the workers table.
2. `trg_increment_worker_jobs` — After a booking status changes to COMPLETED,
   increments workers.total_jobs by 1.
3. `trg_audit_booking_status` — After any booking status change, logs the old and
   new status into audit_log for admin review.

**Q23: What is a foreign key? Give an example.**
A foreign key is a column that references the primary key of another table,
enforcing referential integrity.
Example: `workers.user_id` references `users.id`.
You cannot insert a worker with a user_id that doesn't exist in users.
With `ON DELETE CASCADE`: if the user is deleted, their worker record is also deleted.

**Q24: What is a weak entity? Where is it in your schema?**
A weak entity cannot be uniquely identified by its own attributes alone.
It depends on another (strong) entity for its identity.
In our schema: `services` is a weak entity. Its primary key is `(service_id, worker_id)` —
composite PK. A service cannot exist without a worker. If the worker is deleted,
all their services are deleted too (`ON DELETE CASCADE`).

**Q25: What is the difference between JOIN types used in your queries?**
- `INNER JOIN` (used as `JOIN`): Returns only rows where match exists in BOTH tables.
  Used in WorkerHandler — only shows workers that have matching categories.
- `LEFT JOIN`: Returns ALL rows from left table, NULL for unmatched right rows.
  Used in AdminHandler.AllBookingsHandler — shows ALL bookings even if
  customer/worker records were deleted (uses COALESCE to show 'Unknown').

**Q26: What is a stored procedure? Did you write any?**
A stored procedure is pre-compiled SQL stored in the database, executed by name.
We wrote two:
- `sp_get_worker_profile(worker_id)` — returns full worker details with counts
- `sp_admin_dashboard()` — returns all platform statistics in one call

**Q27: What is a view? What views do you have?**
A view is a virtual table — a saved SELECT query you can query like a table.
Our views:
- `vw_worker_profiles` — approved workers with all joined info
- `vw_booking_summary` — bookings with customer and worker names
- `vw_admin_stats` — platform-wide statistics
- `vw_unread_messages` — unread message counts per conversation


---

### SECTION E: DESIGN PATTERNS & ARCHITECTURE

**Q28: What design pattern is DatabaseConnection.java following?**
It follows the **Singleton-like pattern** (static factory method pattern).
The constructor is private — you cannot instantiate it.
You always call `DatabaseConnection.getConnection()` to get a connection.
This centralizes all database configuration in one place.

**Q29: What is the DAO pattern? Why did you use it?**
DAO (Data Access Object) pattern separates database logic from business logic.
- `UserDAO` only knows about the `users` table
- `AuthHandler` only knows about auth logic — it calls UserDAO, never writes SQL itself
Benefits:
- If you change the database (MySQL → PostgreSQL), you only change DAO classes
- Business logic (handlers) remains unchanged
- Easier to test each layer independently

**Q30: What is REST API?**
REST (Representational State Transfer) is an architectural style for web services.
Key rules:
- Use HTTP methods correctly: GET (read), POST (create), PUT (update), DELETE (delete)
- URLs represent resources: `/api/workers` = all workers, `/api/workers/5` = worker #5
- Stateless: each request contains all info needed (no server sessions)
- Return JSON

Our backend is a REST API. Frontend calls it with HTTP requests and gets JSON back.

**Q31: What HTTP status codes do you use and what do they mean?**
- 200 OK — successful GET or action
- 201 Created — successful POST (new resource created)
- 204 No Content — OPTIONS preflight response (CORS)
- 400 Bad Request — invalid input (e.g., email already registered)
- 401 Unauthorized — wrong credentials
- 403 Forbidden — not allowed (e.g., OTP not verified)
- 404 Not Found — resource doesn't exist
- 405 Method Not Allowed — wrong HTTP method used
- 500 Internal Server Error — unexpected backend exception

**Q32: What is Maven? What does pom.xml do?**
Maven is a build tool for Java projects. `pom.xml` (Project Object Model) defines:
- Project metadata (groupId, artifactId, version)
- Dependencies (MySQL connector, org.json, javax.mail)
- Build plugins (maven-assembly-plugin to create fat JAR)

`mvn clean package` → downloads dependencies, compiles code, creates JAR.
The "fat JAR" (`jar-with-dependencies`) includes all dependency JARs inside one file,
so you can run with just `java -cp`.

**Q33: What is a fat JAR?**
A regular JAR contains only your compiled code. A fat JAR (uber JAR) contains
your code PLUS all dependencies packed inside.
Created by `maven-assembly-plugin` with `jar-with-dependencies` descriptor.
This is why you can run:
```
java -cp target/hunarhub-backend-1.0-SNAPSHOT-jar-with-dependencies.jar com.hunarhub.Main
```
Without separately providing MySQL connector, org.json, etc.


---

### SECTION F: FRONTEND QUESTIONS

**Q34: What is React Native?**
A JavaScript framework for building native mobile apps using React components.
Code is written once in JavaScript/JSX and runs on both Android and iOS.
Unlike a website in a browser, React Native renders actual native UI components.

**Q35: What is Expo?**
Expo is a toolchain/platform built on top of React Native that simplifies:
- Development setup (no Android Studio/Xcode needed initially)
- Testing via "Expo Go" app — scan QR code, app runs on your phone instantly
- Access to device features (camera, storage, etc.) via Expo SDK

**Q36: What is AsyncStorage?**
AsyncStorage is React Native's persistent key-value storage on the device.
It's like `localStorage` in web browsers but for mobile apps.
We use it to store:
- `userRole` → so app remembers you're logged in after closing
- `userId` → so screens know which user's data to fetch

```javascript
await AsyncStorage.setItem('userRole', 'CUSTOMER'); // save
const role = await AsyncStorage.getItem('userRole'); // read
await AsyncStorage.removeItem('userRole');           // delete (logout)
```

**Q37: What is React Context? How does AuthContext work?**
React Context provides a way to share data between components without passing props
through every level of the component tree.

`AuthContext` stores `{ userRole, updateUserRole }`.
Created in `AppNavigator` as `<AuthContext.Provider value={...}>`.
Any screen can access it with `useAuth()` hook:
```javascript
const { userRole, updateUserRole } = useAuth();
updateUserRole('CUSTOMER'); // triggers navigation change
```

**Q38: What is React Navigation?**
A library for navigating between screens. We use `createNativeStackNavigator`.
- `Stack.Navigator` wraps all screens
- `Stack.Screen` registers each screen with a name
- `navigation.navigate('WorkerDetails', { workerId: 5 })` → go to that screen
- `navigation.goBack()` → go back

**Q39: What is the difference between GET and POST?**
- GET: Retrieves data. Parameters in URL. No request body. Idempotent (same result every time).
  Example: `GET /api/workers` → returns list of workers
- POST: Sends data. Parameters in request body (JSON). Creates/changes something.
  Example: `POST /api/bookings` with JSON body → creates a booking

**Q40: How does the chat work technically?**
1. Customer opens ChatScreen with a workerId
2. `messageAPI.getConversation(userId, workerUserId)` → GET /api/messages?user1=X&user2=Y
3. Backend queries messages WHERE (sender=X AND receiver=Y) OR (sender=Y AND receiver=X)
4. Returns array of messages ordered by sent_at ASC
5. Customer types message → `messageAPI.send({senderId, receiverId, text})`
6. Backend inserts into messages table → returns saved message with timestamp
7. Screen adds new message to local state (instant display)
8. Auto-refresh polls every few seconds for new messages


---

### SECTION G: TRICKY / ADVANCED QUESTIONS

**Q41: How does worker approval flow work end to end?**
1. Worker registers → status saved as 'PENDING' in workers table → welcome email sent
2. Admin opens dashboard → calls GET /api/admin/workers/pending
3. Admin taps Approve → POST /api/admin/workers/approve {workerId: 5, status: "APPROVED"}
4. Backend: UPDATE workers SET approval_status='APPROVED' WHERE worker_id=5
5. Email sent to worker: "Your profile is approved!"
6. Worker is now visible in /api/workers (query filters WHERE approval_status='APPROVED')
7. Customers can now find and book this worker

**Q42: Why are there two IDs for workers — users.id and workers.worker_id?**
Because the database is normalized. `users` table stores all users (any role).
`workers` table stores only worker-specific data, with its own auto-increment PK.
- `users.id` = used for login, messages, profile updates
- `workers.worker_id` = used for booking, rating, approval

When creating a booking, frontend sends `workerId` (the workers.worker_id).
The BookingHandler also needs to resolve the customer's `customers.customer_id`
from their `users.id` because the bookings table references `customers.customer_id`.

**Q43: What would happen if you forgot to close a database connection?**
Connection leak — connections stay open in the MySQL connection pool.
MySQL has a max_connections limit (default 151). If all connections are used up,
new requests fail with "Too many connections" error and the server stops working.
Fix: always use try-with-resources so Connection.close() is guaranteed.

**Q44: What is thread safety? Why is ConcurrentHashMap used in OtpStore?**
Thread safety means multiple threads can access the same data simultaneously without
causing corruption.
The Java HTTP server handles each request in a separate thread. If two users request
OTPs at the same time, both threads write to OtpStore simultaneously.
`HashMap` is NOT thread-safe — concurrent writes can corrupt it.
`ConcurrentHashMap` IS thread-safe — built for concurrent access.

**Q45: What is the booking_date issue with ADVANCE vs NORMAL bookings?**
- NORMAL booking: bookingDate = current timestamp (booked now, worker comes ASAP)
- ADVANCE booking: bookingDate = customer-specified future date (scheduled)
- URGENT booking: bookingDate = now, but worker is notified immediately via email

In the code:
```java
if (scheduledAt != null && !scheduledAt.isEmpty()) {
    pstmt.setString(5, scheduledAt);  // customer's chosen date
} else {
    pstmt.setString(5, new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date())); // now
}
```

**Q46: How does the admin delete a user? What happens to their related data?**
`DELETE FROM users WHERE id = ?`
Because of `ON DELETE CASCADE` in the schema, deleting a user automatically deletes:
- Their worker record (if worker)
- Their customer record (if customer)
- All their bookings
- All messages they sent/received
- All ratings they gave/received
This is handled entirely by MySQL — no extra Java code needed.

**Q47: What is the difference between `optString` and `getString` in JSONObject?**
- `getString("key")` → throws `JSONException` if key is missing
- `optString("key", "default")` → returns default value if key is missing, no exception

Used for optional fields like phone, city, whatsapp:
```java
String phone = json.optString("phone", "");  // empty string if not provided
String cnic  = json.getString("cnic");       // throws if not provided (required)
```

**Q48: Why does ForgotPassword always return HTTP 200 even if email doesn't exist?**
This is an anti-enumeration security practice. If we returned 404 for non-existent
emails, attackers could test millions of emails to find valid accounts.
By always returning 200 with "If that email exists, a code has been sent",
we give no information about which emails are registered.

**Q49: What is the `RETURN_GENERATED_KEYS` in JDBC?**
After an INSERT, MySQL generates an auto-increment ID for the new row.
```java
PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
ps.executeUpdate();
ResultSet keys = ps.getGeneratedKeys();
if (keys.next()) {
    int newId = keys.getInt(1); // the auto-generated booking_id
}
```
Without this flag, the generated ID is thrown away and you can't return it to the client.

**Q50: What is the path routing strategy in BookingHandler?**
BookingHandler is registered on `/api/bookings` which prefix-matches ALL sub-paths.
Inside `handle()`, it manually inspects the path and HTTP method:
```java
if ("POST".equals(method) && path.equals("/api/bookings"))                → create
if ("GET".equals(method)  && path.startsWith("/api/bookings/customer/"))  → getByCustomer
if ("PUT".equals(method)  && path.matches("/api/bookings/\\d+/status"))   → updateStatus
```
This is manual routing — doing what frameworks like Spring Boot do automatically.


---

### SECTION H: SHOW ME THE CODE QUESTIONS

**Q51: Show me how Worker inherits from User.**
```java
public class Worker extends User {         // inherits all User fields
    private String cnic;
    private String category;

    public Worker(int id, String name, String email, ..., String category) {
        super(id, name, email, password, phone, dob, city, "WORKER"); // init parent
        this.category = category; // own field
    }

    @Override
    public String getRoleDescription() {   // polymorphism
        return "Worker - Provides services (" + category + ") to customers.";
    }
}
```

**Q52: Show me how a booking is created in the database.**
```java
// From BookingHandler.handleCreateBooking()
String sql = "INSERT INTO bookings (customer_id, worker_id, service_id, type, booking_date, status) " +
             "VALUES (?, ?, ?, ?, ?, 'PENDING')";
PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
pstmt.setInt(1, resolvedCustomerId);
pstmt.setInt(2, workerId);
pstmt.setNull(3, Types.INTEGER); // no specific service
pstmt.setString(4, "NORMAL");
pstmt.setString(5, "2025-06-10 14:00:00");
pstmt.executeUpdate();
ResultSet keys = pstmt.getGeneratedKeys();
int bookingId = keys.getInt(1); // e.g. 12
```

**Q53: Show me the OTP generation and storage.**
```java
// Generate 6-digit OTP (in ForgotPasswordHandler)
SecureRandom rng = new SecureRandom();
String otp = String.format("%06d", rng.nextInt(1_000_000));
// e.g. rng.nextInt(1000000) = 4821 → formatted as "004821"

// Store with timestamp
OtpStore.put(email, otp); // stores in ConcurrentHashMap

// Verify (in VerifyOtpHandler)
boolean valid = OtpStore.verify(email, otp);
// checks: entry exists + not expired (< 10 min) + otp matches
```

**Q54: Show me how JSON response is built and sent.**
```java
// Build JSON
JSONObject response = new JSONObject();
response.put("message", "Login successful");
response.put("userId", 5);
response.put("role", "CUSTOMER");

// Send
byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
exchange.getResponseHeaders().set("Content-Type", "application/json");
exchange.sendResponseHeaders(200, bytes.length);
OutputStream os = exchange.getResponseBody();
os.write(bytes);
os.close();
```

**Q55: Show me how the frontend calls the API.**
```javascript
// api.js — single function for all calls
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const response = await fetch(`http://192.168.100.6:8080/api${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

// Usage in a screen:
const result = await bookingAPI.create({
  customerId: 5,
  workerId: 2,
  type: 'NORMAL'
});
console.log(result.bookingId); // 12
```


---

### SECTION I: SCENARIO / WHAT-IF QUESTIONS

**Q56: What happens if the same email registers twice?**
`UserDAO.getUserByEmail(email)` is called first. If it returns a non-null User,
`AuthHandler` immediately returns HTTP 400 with `{"error": "Email already registered"}`.
The INSERT never runs. The email UNIQUE constraint in MySQL would also catch it as a
backup, but we handle it in Java first for a cleaner error message.

**Q57: What happens if a customer tries to book an unapproved worker?**
BookingHandler queries:
```sql
SELECT approval_status FROM workers WHERE worker_id = ?
```
If not 'APPROVED' → returns HTTP 400: `{"error": "Worker is not available for booking"}`
The booking is never created.

**Q58: What happens if the email server is down?**
All email sends are wrapped in their own try-catch, separate from the main logic:
```java
try {
    EmailSender.sendNewBookingToWorker(...);
} catch (Exception emailEx) {
    System.err.println("Email failed (non-fatal): " + emailEx.getMessage());
    // execution continues normally
}
```
The booking is still created and saved. Only the email is skipped. The server logs
the failure but returns success to the client. "Non-fatal" by design.

**Q59: What if two admins try to approve the same worker at the same time?**
Both would run `UPDATE workers SET approval_status='APPROVED' WHERE worker_id=5`.
MySQL handles row-level locking — the second UPDATE runs after the first completes.
The worker ends up APPROVED (same result). Two approval emails would be sent,
which is a minor bug. Production fix would use a transaction with a check.

**Q60: What happens when the backend starts and MySQL is not running?**
```java
try {
    DatabaseConnection.getConnection().close(); // startup test
    System.out.println("Database connection verified.");
} catch (Exception dbEx) {
    System.err.println("Database connection failed at startup: " + dbEx.getMessage());
    // server still starts — individual requests will fail gracefully
}
```
The server still starts. Individual API requests fail with 500 errors.
This is intentional so the server doesn't crash just because DB had a brief hiccup.

**Q61: What if the IP address changes?**
The `BASE_URL` in `frontend/src/services/api.js` must be updated:
```javascript
const BASE_URL = 'http://192.168.100.6:8080/api'; // ← update this
```
Run `ipconfig` on the PC to get the new IP. Both phone and PC must be on the same Wi-Fi.
This is a known limitation — production apps use a domain name instead of IP.

**Q62: Can a worker book another worker?**
No. The app only shows Booking screen to CUSTOMER role users.
The navigation is role-based: Workers only see WorkerDashboard.
Also the backend's BookingHandler uses `customerId` from customers table —
a worker without a customers table entry would get "Customer not found" error.


---

### SECTION J: LIMITATIONS & IMPROVEMENTS

**Q63: What are the main limitations of your project?**
1. **No password hashing** — passwords stored as plain text. Should use BCrypt.
2. **No JWT authentication** — anyone who knows a userId can make requests for it.
3. **No real-time** — chat requires manual refresh or polling. No WebSockets/FCM.
4. **No connection pooling** — each request opens its own connection. Slow under load.
5. **IP-based URL** — app breaks if network changes. Needs a domain name.
6. **Local network only** — can't be accessed from the internet without port forwarding.

**Q64: How would you add JWT authentication?**
After login, generate a JWT token:
```
Header.Payload.Signature
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjV9.abc123
```
Return it to the client. Client sends it in every request header:
`Authorization: Bearer <token>`
Backend verifies the signature before processing any request.
This proves the request is from a legitimate logged-in user.

**Q65: How would you add real-time chat?**
Replace HTTP polling with WebSockets.
Java has `javax.websocket` for WebSocket servers.
Client sends messages via WebSocket connection that stays open.
Server broadcasts received messages to the other user's connection instantly.
Or use Firebase Realtime Database which handles this automatically.

---

## QUICK REFERENCE CHEAT SHEET

### Key Files → Function
| File | What it does |
|---|---|
| `Main.java` | Starts server, registers routes |
| `User.java` | Abstract parent for all users |
| `Worker.java` | Worker model (extends User) |
| `Customer.java` | Customer model (extends User) |
| `DatabaseConnection.java` | Opens MySQL connection via JDBC |
| `UserDAO.java` | getUserByEmail, createUser |
| `WorkerDAO.java` | createWorker (resolves category FK) |
| `AuthHandler.java` | Register, Login, OTP, Reset password |
| `WorkerHandler.java` | GET all workers, GET worker by ID |
| `BookingHandler.java` | Create booking, update status |
| `AdminHandler.java` | Stats, approve workers, manage users |
| `MessageHandler.java` | Get/send chat messages |
| `EmailSender.java` | 10 types of HTML email via Gmail SMTP |
| `OtpStore.java` | In-memory OTP with 10-min expiry |
| `AppNavigator.js` | Role-based screen routing |
| `AuthContext.js` | Shared login state across all screens |
| `api.js` | All backend HTTP calls from frontend |

### Key Concepts → Location
| Concept | Where |
|---|---|
| Abstract class | `User.java` |
| Inheritance | `Worker extends User`, `Customer extends User` |
| Polymorphism | `getRoleDescription()` in all 3 subclasses |
| Interface | `implements HttpHandler` in all handlers |
| Encapsulation | Private fields + getters/setters in all models |
| Anonymous class | `AuthHandler.RegisterHandler` + `UserDAO` |
| Static methods | `DatabaseConnection`, `OtpStore`, `EmailSender` |
| Inner static class | `AuthHandler` (5 inner classes), `AdminHandler` (7 inner classes) |
| PreparedStatement | Every DAO and Handler that touches DB |
| try-with-resources | Every `Connection conn = DatabaseConnection.getConnection()` |
| ConcurrentHashMap | `OtpStore` for thread-safe OTP storage |

---

*Good luck in your viva! Remember: understand the flow, don't just memorize code.*
*If you can explain WHY each decision was made, you'll score full marks.*
