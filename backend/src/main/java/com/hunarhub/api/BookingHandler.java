package com.hunarhub.api;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.utils.EmailSender;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Handles all /api/bookings/* routes:
 *   POST   /api/bookings                        – create booking
 *   GET    /api/bookings/customer/{customerId}  – customer's bookings
 *   GET    /api/bookings/worker/{workerId}      – worker's bookings
 *   PUT    /api/bookings/{bookingId}/status     – worker accepts/rejects
 */
public class BookingHandler implements HttpHandler {

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
    }

    private String getRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path   = exchange.getRequestURI().getPath(); // /api/bookings[/...]
        String method = exchange.getRequestMethod();

        // POST /api/bookings  → create
        if ("POST".equals(method) && path.equals("/api/bookings")) {
            handleCreateBooking(exchange);
            return;
        }

        // GET /api/bookings/customer/{id}
        if ("GET".equals(method) && path.startsWith("/api/bookings/customer/")) {
            String[] parts = path.split("/");
            if (parts.length >= 5) {
                try {
                    int customerId = Integer.parseInt(parts[4]);
                    handleGetByCustomer(exchange, customerId);
                } catch (NumberFormatException e) {
                    sendResponse(exchange, 400, "{\"error\":\"Invalid customer ID\"}");
                }
            } else {
                sendResponse(exchange, 400, "{\"error\":\"Missing customer ID\"}");
            }
            return;
        }

        // GET /api/bookings/worker/{id}
        if ("GET".equals(method) && path.startsWith("/api/bookings/worker/")) {
            String[] parts = path.split("/");
            if (parts.length >= 5) {
                try {
                    int workerId = Integer.parseInt(parts[4]);
                    handleGetByWorker(exchange, workerId);
                } catch (NumberFormatException e) {
                    sendResponse(exchange, 400, "{\"error\":\"Invalid worker ID\"}");
                }
            } else {
                sendResponse(exchange, 400, "{\"error\":\"Missing worker ID\"}");
            }
            return;
        }

        // PUT /api/bookings/{id}/status
        if ("PUT".equals(method) && path.matches("/api/bookings/\\d+/status")) {
            String[] parts = path.split("/");
            try {
                int bookingId = Integer.parseInt(parts[3]);
                handleUpdateStatus(exchange, bookingId);
            } catch (NumberFormatException e) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid booking ID\"}");
            }
            return;
        }

        sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
    }

    // ── POST /api/bookings ────────────────────────────────────────────────────
    private void handleCreateBooking(HttpExchange exchange) throws IOException {
        try {
            JSONObject json = new JSONObject(getRequestBody(exchange));

            int    customerId   = json.getInt("customerId");
            int    workerId     = json.getInt("workerId");
            int    serviceId    = json.optInt("serviceId", 0);
            String type         = json.optString("type", "NORMAL");
            String scheduledAt  = json.optString("scheduledAt", null); // for ADVANCE bookings

            try (Connection conn = DatabaseConnection.getConnection()) {

                // Validate worker is APPROVED
                PreparedStatement chk = conn.prepareStatement(
                    "SELECT approval_status FROM workers WHERE worker_id = ?");
                chk.setInt(1, workerId);
                ResultSet chkRs = chk.executeQuery();
                if (!chkRs.next() || !"APPROVED".equals(chkRs.getString("approval_status"))) {
                    sendResponse(exchange, 400, "{\"error\":\"Worker is not available for booking\"}");
                    return;
                }

                // Resolve customer_id from users.id (customers table uses its own PK)
                PreparedStatement cstmt = conn.prepareStatement(
                    "SELECT customer_id FROM customers WHERE user_id = ?");
                cstmt.setInt(1, customerId);
                ResultSet crs = cstmt.executeQuery();
                if (!crs.next()) {
                    sendResponse(exchange, 400, "{\"error\":\"Customer not found\"}");
                    return;
                }
                int resolvedCustomerId = crs.getInt("customer_id");

                String sql = "INSERT INTO bookings (customer_id, worker_id, service_id, type, booking_date, status) " +
                             "VALUES (?, ?, ?, ?, ?, 'PENDING')";
                PreparedStatement pstmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
                pstmt.setInt(1, resolvedCustomerId);
                pstmt.setInt(2, workerId);
                if (serviceId > 0) pstmt.setInt(3, serviceId);
                else               pstmt.setNull(3, java.sql.Types.INTEGER);
                pstmt.setString(4, type);
                // For ADVANCE use provided date, otherwise NOW()
                if (scheduledAt != null && !scheduledAt.isEmpty()) {
                    pstmt.setString(5, scheduledAt);
                } else {
                    pstmt.setString(5, new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                        .format(new java.util.Date()));
                }
                pstmt.executeUpdate();

                ResultSet keys = pstmt.getGeneratedKeys();
                int newBookingId = keys.next() ? keys.getInt(1) : 0;

                // Notify worker via email (non-critical — never fail the booking if email fails)
                try {
                    PreparedStatement wstmt = conn.prepareStatement(
                        "SELECT u.email, u.name FROM users u " +
                        "JOIN workers w ON u.id = w.user_id WHERE w.worker_id = ?");
                    wstmt.setInt(1, workerId);
                    ResultSet wrs = wstmt.executeQuery();
                    if (wrs.next()) {
                        String workerEmail = wrs.getString("email");
                        String workerName  = wrs.getString("name");
                        String emailBody   = "Hello " + workerName + ",\n\nYou have received a new " + type +
                            " booking request on HunarHub. Please check your dashboard to accept or reject it.\n\nBest Regards,\nHunarHub Team";
                        EmailSender.sendEmail(workerEmail, "New " + type + " Booking Request", emailBody);
                    }
                } catch (Exception emailEx) {
                    System.err.println("Email notification failed (non-fatal): " + emailEx.getMessage());
                }

                JSONObject resp = new JSONObject();
                resp.put("message",   "Booking created successfully");
                resp.put("bookingId", newBookingId);
                sendResponse(exchange, 201, resp.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // ── GET /api/bookings/customer/{customerId} ───────────────────────────────
    private void handleGetByCustomer(HttpExchange exchange, int userId) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            // Resolve customer_id from user_id
            PreparedStatement cstmt = conn.prepareStatement(
                "SELECT customer_id FROM customers WHERE user_id = ?");
            cstmt.setInt(1, userId);
            ResultSet crs = cstmt.executeQuery();
            if (!crs.next()) {
                sendResponse(exchange, 200, "[]");
                return;
            }
            int customerId = crs.getInt("customer_id");

            String sql =
                "SELECT b.booking_id, b.type, b.booking_date, b.status, " +
                "w.worker_id, wu.name AS worker_name, wu.city AS worker_city, w.category, w.rating " +
                "FROM bookings b " +
                "JOIN workers w  ON b.worker_id  = w.worker_id " +
                "JOIN users wu   ON w.user_id     = wu.id " +
                "WHERE b.customer_id = ? " +
                "ORDER BY b.booking_date DESC";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();

            JSONArray arr = new JSONArray();
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("bookingId",   rs.getInt("booking_id"));
                o.put("type",        rs.getString("type"));
                o.put("bookingDate", rs.getString("booking_date"));
                o.put("status",      rs.getString("status"));
                o.put("workerId",    rs.getInt("worker_id"));
                o.put("workerName",  rs.getString("worker_name"));
                o.put("workerCity",  rs.getString("worker_city") != null ? rs.getString("worker_city") : "");
                o.put("category",    rs.getString("category"));
                o.put("rating",      rs.getFloat("rating"));
                arr.put(o);
            }
            sendResponse(exchange, 200, arr.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
        }
    }

    // ── GET /api/bookings/worker/{workerId} ───────────────────────────────────
    private void handleGetByWorker(HttpExchange exchange, int workerId) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql =
                "SELECT b.booking_id, b.type, b.booking_date, b.status, " +
                "c.customer_id, cu.id AS customer_user_id, cu.name AS customer_name, cu.phone AS customer_phone, cu.city AS customer_city " +
                "FROM bookings b " +
                "JOIN customers c ON b.customer_id = c.customer_id " +
                "JOIN users cu    ON c.user_id      = cu.id " +
                "WHERE b.worker_id = ? " +
                "ORDER BY b.booking_date DESC";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, workerId);
            ResultSet rs = ps.executeQuery();

            JSONArray arr = new JSONArray();
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("bookingId",       rs.getInt("booking_id"));
                o.put("type",            rs.getString("type"));
                o.put("bookingDate",     rs.getString("booking_date"));
                o.put("status",          rs.getString("status"));
                o.put("customerId",      rs.getInt("customer_id"));
                o.put("customerUserId",  rs.getInt("customer_user_id"));
                o.put("customerName",    rs.getString("customer_name"));
                o.put("customerPhone",   rs.getString("customer_phone") != null ? rs.getString("customer_phone") : "");
                o.put("customerCity",    rs.getString("customer_city")  != null ? rs.getString("customer_city")  : "");
                arr.put(o);
            }
            sendResponse(exchange, 200, arr.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
        }
    }

    // ── PUT /api/bookings/{bookingId}/status ──────────────────────────────────
    private void handleUpdateStatus(HttpExchange exchange, int bookingId) throws IOException {
        try {
            JSONObject json   = new JSONObject(getRequestBody(exchange));
            String     status = json.getString("status"); // ACCEPTED, REJECTED, COMPLETED

            if (!status.equals("ACCEPTED") && !status.equals("REJECTED") && !status.equals("COMPLETED")) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid status. Use ACCEPTED, REJECTED, or COMPLETED\"}");
                return;
            }

            try (Connection conn = DatabaseConnection.getConnection()) {
                PreparedStatement ps = conn.prepareStatement(
                    "UPDATE bookings SET status = ? WHERE booking_id = ?");
                ps.setString(1, status);
                ps.setInt(2, bookingId);
                int rows = ps.executeUpdate();

                if (rows > 0) {
                    // Notify customer (non-critical — never fail the status update if email fails)
                    try {
                        PreparedStatement nstmt = conn.prepareStatement(
                            "SELECT cu.email, cu.name FROM bookings b " +
                            "JOIN customers c ON b.customer_id = c.customer_id " +
                            "JOIN users cu    ON c.user_id     = cu.id " +
                            "WHERE b.booking_id = ?");
                        nstmt.setInt(1, bookingId);
                        ResultSet nrs = nstmt.executeQuery();
                        if (nrs.next()) {
                            String customerEmail = nrs.getString("email");
                            String customerName  = nrs.getString("name");
                            String emailBody = "Hello " + customerName + ",\n\nYour booking #" + bookingId +
                                " has been " + status.toLowerCase() + " by the worker.\n\nBest Regards,\nHunarHub Team";
                            EmailSender.sendEmail(customerEmail, "Booking " + status + " - HunarHub", emailBody);
                        }
                    } catch (Exception emailEx) {
                        System.err.println("Email notification failed (non-fatal): " + emailEx.getMessage());
                    }
                    sendResponse(exchange, 200, "{\"message\":\"Booking status updated to " + status + "\"}");
                } else {
                    sendResponse(exchange, 404, "{\"error\":\"Booking not found\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
