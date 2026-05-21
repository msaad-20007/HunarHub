package com.hunarhub.api;

import com.hunarhub.dao.UserDAO;
import com.hunarhub.dao.WorkerDAO;
import com.hunarhub.dao.CustomerDAO;
import com.hunarhub.models.User;
import com.hunarhub.models.Worker;
import com.hunarhub.models.Customer;
import com.hunarhub.utils.EmailSender;
import com.hunarhub.utils.OtpStore;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

public class AuthHandler {

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        // Handle CORS
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String getRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return com.hunarhub.utils.IOUtils.readString(is);
        }
    }

    public static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }

            try {
                String requestBody = getRequestBody(exchange);
                JSONObject json = new JSONObject(requestBody);

                String name = json.getString("name");
                String email = json.getString("email");
                String password = json.getString("password");
                String phone = json.optString("phone", "");
                String city = json.optString("city", "");
                String role = json.getString("role"); // "WORKER" or "CUSTOMER"

                UserDAO userDAO = new UserDAO();
                
                // Check if user exists
                if (userDAO.getUserByEmail(email) != null) {
                    sendResponse(exchange, 400, "{\"error\": \"Email already registered\"}");
                    return;
                }

                // Create base User
                User newUser = new User(0, name, email, password, phone, null, city, role) {
                    @Override
                    public String getRoleDescription() { return role; }
                };

                int userId = userDAO.createUser(newUser);
                
                if (userId > 0) {
                    // Create specific role entry
                    if ("WORKER".equals(role)) {
                        WorkerDAO workerDAO = new WorkerDAO();
                        Worker worker = new Worker();
                        worker.setId(userId);
                        worker.setWorkerId(userId); // Simplified
                        worker.setCnic(json.getString("cnic"));
                        worker.setWhatsapp(json.optString("whatsapp", phone));
                        worker.setCategory(json.getString("category"));
                        worker.setApprovalStatus("PENDING");
                        worker.setRating(0.0f);
                        workerDAO.createWorker(worker);
                    } else if ("CUSTOMER".equals(role)) {
                        CustomerDAO customerDAO = new CustomerDAO();
                        Customer customer = new Customer();
                        customer.setId(userId);
                        customer.setCustomerId(userId); // Simplified
                        customerDAO.createCustomer(customer);
                    }

                    // Send Welcome Email
                    if ("WORKER".equals(role)) {
                        EmailSender.sendWelcomeWorker(email, name, json.getString("category"));
                    } else {
                        EmailSender.sendWelcomeCustomer(email, name);
                    }

                    sendResponse(exchange, 201, "{\"message\": \"Registration successful\", \"userId\": " + userId + "}");
                } else {
                    sendResponse(exchange, 500, "{\"error\": \"Failed to register user\"}");
                }

            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 400, "{\"error\": \"Invalid request format\"}");
            }
        }
    }

    public static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }

            try {
                String requestBody = getRequestBody(exchange);
                JSONObject json = new JSONObject(requestBody);

                String email = json.getString("email");
                String password = json.getString("password");

                UserDAO userDAO = new UserDAO();
                User user = userDAO.getUserByEmail(email);

                if (user != null && user.getPassword().equals(password)) {
                    // Simple login logic (no JWT for simplicity as requested)
                    JSONObject responseJson = new JSONObject();
                    responseJson.put("message", "Login successful");
                    responseJson.put("userId", user.getId());
                    responseJson.put("name", user.getName());
                    responseJson.put("role", user.getRole());
                    
                    sendResponse(exchange, 200, responseJson.toString());
                } else {
                    sendResponse(exchange, 401, "{\"error\": \"Invalid credentials\"}");
                }

            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 400, "{\"error\": \"Invalid request format\"}");
            }
        }
    }

    // ── POST /api/auth/forgot-password  { email } ─────────────────────────────
    public static class ForgotPasswordHandler implements HttpHandler {
        private static final SecureRandom rng = new SecureRandom();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendResponse(exchange, 204, ""); return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try {
                JSONObject json  = new JSONObject(getRequestBody(exchange));
                String     email = json.getString("email").trim().toLowerCase();

                UserDAO userDAO = new UserDAO();
                User    user    = userDAO.getUserByEmail(email);

                // Always return 200 to avoid email enumeration
                if (user == null) {
                    sendResponse(exchange, 200, "{\"message\":\"If that email exists, a code has been sent.\"}");
                    return;
                }

                // Generate 6-digit OTP
                String otp = String.format("%06d", rng.nextInt(1_000_000));
                OtpStore.put(email, otp);

                // Send email (non-fatal)
                try {
                    EmailSender.sendPasswordResetOtp(email, user.getName(), otp);
                } catch (Exception ex) {
                    System.err.println("OTP email failed: " + ex.getMessage());
                }

                sendResponse(exchange, 200, "{\"message\":\"If that email exists, a code has been sent.\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 400, "{\"error\":\"Invalid request\"}");
            }
        }
    }

    // ── POST /api/auth/verify-otp  { email, otp } ────────────────────────────
    public static class VerifyOtpHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendResponse(exchange, 204, ""); return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try {
                JSONObject json  = new JSONObject(getRequestBody(exchange));
                String     email = json.getString("email").trim().toLowerCase();
                String     otp   = json.getString("otp").trim();

                if (OtpStore.verify(email, otp)) {
                    // Mark email as verified so reset-password can proceed
                    OtpStore.put(email, "VERIFIED");
                    sendResponse(exchange, 200, "{\"message\":\"OTP verified\"}");
                } else {
                    sendResponse(exchange, 400, "{\"error\":\"Invalid or expired code\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 400, "{\"error\":\"Invalid request\"}");
            }
        }
    }

    // ── POST /api/auth/reset-password  { email, newPassword } ────────────────
    public static class ResetPasswordHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendResponse(exchange, 204, ""); return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try {
                JSONObject json        = new JSONObject(getRequestBody(exchange));
                String     email       = json.getString("email").trim().toLowerCase();
                String     newPassword = json.getString("newPassword").trim();

                if (newPassword.length() < 6) {
                    sendResponse(exchange, 400, "{\"error\":\"Password must be at least 6 characters\"}");
                    return;
                }

                // Must have a VERIFIED token
                if (!OtpStore.verify(email, "VERIFIED")) {
                    sendResponse(exchange, 403, "{\"error\":\"Please verify your OTP first\"}");
                    return;
                }

                // Update password in DB
                try (java.sql.Connection conn = com.hunarhub.db.DatabaseConnection.getConnection()) {
                    java.sql.PreparedStatement ps = conn.prepareStatement(
                        "UPDATE users SET password = ? WHERE LOWER(email) = ?");
                    ps.setString(1, newPassword);
                    ps.setString(2, email);
                    int rows = ps.executeUpdate();
                    if (rows > 0) {
                        sendResponse(exchange, 200, "{\"message\":\"Password reset successfully\"}");
                    } else {
                        sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 400, "{\"error\":\"Invalid request\"}");
            }
        }
    }
}
