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

public class AdminHandler {

    private static void sendResponse(HttpExchange exchange, int code, String body) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return com.hunarhub.utils.IOUtils.readString(is);
        }
    }

    // GET /api/admin/workers/pending
    public static class PendingWorkersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT u.id, u.name, u.email, u.phone, u.city, u.dob, " +
                             "w.worker_id, w.cnic, w.whatsapp, w.category, w.approval_status, w.rating " +
                             "FROM users u JOIN workers w ON u.id = w.user_id " +
                             "WHERE w.approval_status = 'PENDING'";
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                JSONArray arr = new JSONArray();
                while (rs.next()) arr.put(workerRow(rs));
                sendResponse(exchange, 200, arr.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // GET /api/admin/workers/all
    public static class AllWorkersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT u.id, u.name, u.email, u.phone, u.city, u.dob, " +
                             "w.worker_id, w.cnic, w.whatsapp, w.category, w.approval_status, w.rating " +
                             "FROM users u JOIN workers w ON u.id = w.user_id " +
                             "ORDER BY w.approval_status, u.name";
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                JSONArray arr = new JSONArray();
                while (rs.next()) arr.put(workerRow(rs));
                sendResponse(exchange, 200, arr.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // GET /api/admin/customers
    public static class AllCustomersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT u.id, u.name, u.email, u.phone, u.city, u.dob, c.customer_id " +
                             "FROM users u JOIN customers c ON u.id = c.user_id ORDER BY u.name";
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                JSONArray arr = new JSONArray();
                while (rs.next()) {
                    JSONObject o = new JSONObject();
                    o.put("id",         rs.getInt("id"));
                    o.put("customerId", rs.getInt("customer_id"));
                    o.put("name",       rs.getString("name"));
                    o.put("email",      rs.getString("email"));
                    o.put("phone",      rs.getString("phone"));
                    o.put("city",       rs.getString("city"));
                    o.put("dob",        rs.getString("dob") != null ? rs.getString("dob") : "");
                    arr.put(o);
                }
                sendResponse(exchange, 200, arr.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // GET /api/admin/stats
    public static class StatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try (Connection conn = DatabaseConnection.getConnection()) {
                JSONObject stats = new JSONObject();

                ResultSet r1 = conn.prepareStatement("SELECT COUNT(*) FROM workers WHERE approval_status='PENDING'").executeQuery();
                if (r1.next()) stats.put("pendingWorkers", r1.getInt(1));

                ResultSet r2 = conn.prepareStatement("SELECT COUNT(*) FROM workers WHERE approval_status='APPROVED'").executeQuery();
                if (r2.next()) stats.put("approvedWorkers", r2.getInt(1));

                ResultSet r3 = conn.prepareStatement("SELECT COUNT(*) FROM customers").executeQuery();
                if (r3.next()) stats.put("totalCustomers", r3.getInt(1));

                ResultSet r4 = conn.prepareStatement("SELECT COUNT(*) FROM bookings").executeQuery();
                if (r4.next()) stats.put("totalBookings", r4.getInt(1));

                sendResponse(exchange, 200, stats.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // POST /api/admin/workers/approve   body: {"workerId": 5, "status": "APPROVED"}
    public static class ApproveWorkerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try {
                JSONObject body = new JSONObject(readBody(exchange));
                int    workerId = body.getInt("workerId");
                String status   = body.getString("status"); // APPROVED or REJECTED

                if (!status.equals("APPROVED") && !status.equals("REJECTED")) {
                    sendResponse(exchange, 400, "{\"error\":\"Invalid status\"}"); return;
                }

                try (Connection conn = DatabaseConnection.getConnection()) {
                    PreparedStatement ps = conn.prepareStatement(
                        "UPDATE workers SET approval_status = ? WHERE worker_id = ?");
                    ps.setString(1, status);
                    ps.setInt(2, workerId);
                    int rows = ps.executeUpdate();
                    if (rows > 0) {
                        // Send approval/rejection email to worker (non-critical)
                        try {
                            PreparedStatement ep = conn.prepareStatement(
                                "SELECT u.email, u.name, w.category FROM users u " +
                                "JOIN workers w ON u.id = w.user_id WHERE w.worker_id = ?");
                            ep.setInt(1, workerId);
                            ResultSet er = ep.executeQuery();
                            if (er.next()) {
                                String wEmail    = er.getString("email");
                                String wName     = er.getString("name");
                                String wCategory = er.getString("category");
                                if ("APPROVED".equals(status)) {
                                    EmailSender.sendWorkerApproved(wEmail, wName, wCategory);
                                } else {
                                    EmailSender.sendWorkerRejected(wEmail, wName);
                                }
                            }
                        } catch (Exception emailEx) {
                            System.err.println("Approval email failed (non-fatal): " + emailEx.getMessage());
                        }
                        sendResponse(exchange, 200, "{\"message\":\"Worker status updated to " + status + "\"}");
                    } else {
                        sendResponse(exchange, 404, "{\"error\":\"Worker not found\"}");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // DELETE /api/admin/users/delete   body: {"userId": 5}
    public static class DeleteUserHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try {
                JSONObject body = new JSONObject(readBody(exchange));
                int userId = body.getInt("userId");
                try (Connection conn = DatabaseConnection.getConnection()) {
                    PreparedStatement ps = conn.prepareStatement("DELETE FROM users WHERE id = ?");
                    ps.setInt(1, userId);
                    int rows = ps.executeUpdate();
                    if (rows > 0) {
                        sendResponse(exchange, 200, "{\"message\":\"User deleted\"}");
                    } else {
                        sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // GET /api/admin/bookings
    public static class AllBookingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
            }
            try (Connection conn = DatabaseConnection.getConnection()) {
                // Use LEFT JOINs so bookings still show even if customer/worker rows are missing
                String sql = "SELECT b.booking_id, b.type, b.booking_date, b.status, " +
                             "b.customer_id, b.worker_id, " +
                             "COALESCE(cu.name, 'Unknown') as customer_name, " +
                             "COALESCE(wu.name, 'Unknown') as worker_name, " +
                             "COALESCE(wu.city, '') as worker_city, " +
                             "COALESCE(w.category, 'N/A') as category " +
                             "FROM bookings b " +
                             "LEFT JOIN customers c ON b.customer_id = c.customer_id " +
                             "LEFT JOIN users cu ON c.user_id = cu.id " +
                             "LEFT JOIN workers w ON b.worker_id = w.worker_id " +
                             "LEFT JOIN users wu ON w.user_id = wu.id " +
                             "ORDER BY b.booking_date DESC";
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                JSONArray arr = new JSONArray();
                while (rs.next()) {
                    JSONObject o = new JSONObject();
                    o.put("bookingId",    rs.getInt("booking_id"));
                    o.put("type",         rs.getString("type"));
                    o.put("bookingDate",  rs.getString("booking_date"));
                    o.put("status",       rs.getString("status"));
                    o.put("customerId",   rs.getInt("customer_id"));
                    o.put("customerName", rs.getString("customer_name"));
                    o.put("workerId",     rs.getInt("worker_id"));
                    o.put("workerName",   rs.getString("worker_name"));
                    o.put("workerCity",   rs.getString("worker_city"));
                    o.put("category",     rs.getString("category"));
                    arr.put(o);
                }
                sendResponse(exchange, 200, arr.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
            }
        }
    }

    // Helper
    private static JSONObject workerRow(ResultSet rs) throws Exception {
        JSONObject o = new JSONObject();
        o.put("id",             rs.getInt("id"));
        o.put("workerId",       rs.getInt("worker_id"));
        o.put("name",           rs.getString("name"));
        o.put("email",          rs.getString("email"));
        o.put("phone",          rs.getString("phone"));
        o.put("city",           rs.getString("city"));
        o.put("dob",            rs.getString("dob") != null ? rs.getString("dob") : "");
        o.put("cnic",           rs.getString("cnic"));
        o.put("whatsapp",       rs.getString("whatsapp"));
        o.put("category",       rs.getString("category"));
        o.put("approvalStatus", rs.getString("approval_status"));
        o.put("rating",         rs.getFloat("rating"));
        return o;
    }
}
