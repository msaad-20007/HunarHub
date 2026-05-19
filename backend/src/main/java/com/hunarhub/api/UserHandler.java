package com.hunarhub.api;

import com.hunarhub.db.DatabaseConnection;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Handles:
 *   GET /api/users/{id}   – fetch user profile (+ worker details if WORKER)
 *   PUT /api/users/{id}   – update user profile (name, phone, city)
 */
public class UserHandler implements HttpHandler {

    private void sendResponse(HttpExchange exchange, int code, String body) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
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

    private String getRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return com.hunarhub.utils.IOUtils.readString(is);
        }
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath(); // /api/users/{id}
        String[] parts = path.split("/");
        if (parts.length < 4) {
            sendResponse(exchange, 400, "{\"error\":\"Missing user ID\"}");
            return;
        }
        int userId;
        try { userId = Integer.parseInt(parts[3]); }
        catch (NumberFormatException e) {
            sendResponse(exchange, 400, "{\"error\":\"Invalid user ID\"}");
            return;
        }

        String method = exchange.getRequestMethod();
        if ("GET".equals(method)) {
            handleGetProfile(exchange, userId);
        } else if ("PUT".equals(method)) {
            handleUpdateProfile(exchange, userId);
        } else {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    // ── GET /api/users/{id} ───────────────────────────────────────────────────
    private void handleGetProfile(HttpExchange exchange, int userId) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(
                "SELECT id, name, email, phone, city, dob, role FROM users WHERE id = ?");
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();

            if (!rs.next()) {
                sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
                return;
            }

            JSONObject user = new JSONObject();
            user.put("id",    rs.getInt("id"));
            user.put("name",  rs.getString("name"));
            user.put("email", rs.getString("email"));
            user.put("phone", rs.getString("phone") != null ? rs.getString("phone") : "");
            user.put("city",  rs.getString("city")  != null ? rs.getString("city")  : "");
            user.put("dob",   rs.getString("dob")   != null ? rs.getString("dob")   : "");
            user.put("role",  rs.getString("role"));

            String role = rs.getString("role");

            if ("WORKER".equals(role)) {
                PreparedStatement wp = conn.prepareStatement(
                    "SELECT worker_id, cnic, whatsapp, category, approval_status, rating " +
                    "FROM workers WHERE user_id = ?");
                wp.setInt(1, userId);
                ResultSet wr = wp.executeQuery();
                if (wr.next()) {
                    user.put("workerId",       wr.getInt("worker_id"));
                    user.put("cnic",           wr.getString("cnic"));
                    user.put("whatsapp",       wr.getString("whatsapp") != null ? wr.getString("whatsapp") : "");
                    user.put("category",       wr.getString("category"));
                    user.put("approvalStatus", wr.getString("approval_status"));
                    user.put("rating",         wr.getFloat("rating"));
                }
            }

            sendResponse(exchange, 200, user.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Server error\"}");
        }
    }

    // ── PUT /api/users/{id} ───────────────────────────────────────────────────
    private void handleUpdateProfile(HttpExchange exchange, int userId) throws IOException {
        try {
            JSONObject json = new JSONObject(getRequestBody(exchange));
            String name  = json.optString("name",  null);
            String phone = json.optString("phone", null);
            String city  = json.optString("city",  null);

            if (name == null && phone == null && city == null) {
                sendResponse(exchange, 400, "{\"error\":\"No fields to update\"}");
                return;
            }

            try (Connection conn = DatabaseConnection.getConnection()) {
                StringBuilder sql = new StringBuilder("UPDATE users SET ");
                java.util.List<Object> params = new java.util.ArrayList<>();

                if (name  != null) { sql.append("name = ?, ");  params.add(name); }
                if (phone != null) { sql.append("phone = ?, "); params.add(phone); }
                if (city  != null) { sql.append("city = ?, ");  params.add(city); }

                // Remove trailing ", "
                sql.setLength(sql.length() - 2);
                sql.append(" WHERE id = ?");
                params.add(userId);

                PreparedStatement ps = conn.prepareStatement(sql.toString());
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                int rows = ps.executeUpdate();

                if (rows > 0) {
                    sendResponse(exchange, 200, "{\"message\":\"Profile updated successfully\"}");
                } else {
                    sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
