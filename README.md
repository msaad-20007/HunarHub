# HunarHub - Premium Local Service Hiring Platform

HunarHub is a complete full-stack mobile application that connects customers with local Pakistani workers (Plumbers, Electricians, Painters, Mechanics, etc.). Built with a modern **React Native (Expo)** frontend and a lightweight **Java OOP** backend without complex enterprise frameworks.

## 🌟 Features
* **Premium UI/UX:** Dark mode, gradients, and micro-animations.
* **Role-based Portals:** Distinct workflows for Admins, Workers, and Customers.
* **Smart Booking System:** Support for `NORMAL`, `ADVANCE`, and `URGENT` bookings.
* **Automated Emails:** SMTP integration for registration welcomes and worker booking alerts.
* **Java Core Backend:** Built entirely with core Java `HttpServer` and pure JDBC for maximum OOP learning.

---

## 🛠️ Tech Stack
* **Frontend:** React Native, Expo, React Navigation, React Native Reanimated.
* **Backend:** Java 17+, `com.sun.net.httpserver`, JDBC.
* **Database:** MySQL.
* **Email:** `javax.mail` via Gmail SMTP.

---

## 🚀 Step-by-Step Running Guide

### Prerequisites
1. **Node.js** installed (v18+ recommended).
2. **Java JDK 17+** installed.
3. **Maven** installed (for backend dependency management).
4. **MySQL Server** installed (e.g., via XAMPP, WAMP, or standalone MySQL Installer).
5. **Expo Go** app installed on your physical mobile device, or Android Studio installed for emulation.

---

### Step 1: Database Setup
1. Open your MySQL client (e.g., phpMyAdmin, MySQL Workbench, or CLI).
2. Create the `hunarhub` database and tables by running the provided schema:
   * Locate the `backend/schema.sql` file.
   * Execute its contents in your MySQL client.
3. Verify that 8 tables were created (`users`, `workers`, `customers`, `services`, `bookings`, `messages`, `ratings`, `categories`).

---

### Step 2: Backend Configuration
1. Navigate to the database configuration file:
   `backend/src/main/java/com/hunarhub/db/DatabaseConnection.java`
2. Update the credentials if your local MySQL uses something other than `root` and `password`:
   ```java
   private static final String DB_USER = "root";
   private static final String DB_PASSWORD = "password"; // Update this!
   ```
3. Navigate to the email configuration file:
   `backend/src/main/java/com/hunarhub/utils/EmailSender.java`
4. Update the Gmail SMTP credentials:
   ```java
   private static final String EMAIL_USERNAME = "your_email@gmail.com"; 
   private static final String EMAIL_PASSWORD = "your_app_password"; // Use an App Password, not normal password
   ```

---

### Step 3: Run the Java Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Compile and package the project using Maven:
   ```bash
   mvn clean package
   ```
3. Run the compiled application:
   ```bash
   java -cp target/hunarhub-backend-1.0-SNAPSHOT-jar-with-dependencies.jar com.hunarhub.Main
   ```
   *(Alternatively, just run `Main.java` directly through your IDE like IntelliJ or Eclipse).*
4. You should see `Database connected successfully.` and `HunarHub Backend Server started on port 8080`.

---

### Step 4: Run the React Native Frontend
1. Open a **new** terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. To view the app:
   * **Android Emulator:** Press `a` in the terminal.
   * **Physical Device:** Scan the QR code with the **Expo Go** app on your phone. 
   *(Note: Ensure your phone and computer are on the same Wi-Fi network).*

---

### Important Notes
* **Localhost IP:** By default, the frontend API service (`frontend/src/services/api.js`) points to `http://10.0.2.2:8080/api` which is the alias for `localhost` in the Android Emulator. If you are testing on a physical device, change `10.0.2.2` to your computer's local IPv4 address (e.g., `192.168.1.5`).
* **Admin Login:** The `schema.sql` creates a default Admin account:
  * **Email:** `admin@hunarhub.com`
  * **Password:** `admin123`
