package com.hunarhub.api;

import com.hunarhub.db.DatabaseConnection;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Handles:
 *   GET /api/workers          – list all approved workers
 *   GET /api/workers/{id}     – get single worker by worker_id
 */
public class WorkerHandler implements HttpHandler {

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
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

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        String path = exchange.getRequestURI().getPath(); // /api/workers or /api/workers/5
        String[] parts = path.split("/");

        if (parts.length >= 4 && !parts[3].isEmpty()) {
            // GET /api/workers/{id}
            try {
                int workerId = Integer.parseInt(parts[3]);
                handleGetWorkerById(exchange, workerId);
            } catch (NumberFormatException e) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid worker ID\"}");
            }
        } else {
            // GET /api/workers
            handleGetAllWorkers(exchange);
        }
    }

    private void handleGetAllWorkers(HttpExchange exchange) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql =
                "SELECT u.id, u.name, u.city, u.phone, " +
                "w.worker_id, w.category, w.rating, w.whatsapp " +
                "FROM users u JOIN workers w ON u.id = w.user_id " +
                "WHERE w.approval_status = 'APPROVED' " +
                "ORDER BY w.rating DESC";

            PreparedStatement pstmt = conn.prepareStatement(sql);
            ResultSet rs = pstmt.executeQuery();

            JSONArray workersArray = new JSONArray();
            while (rs.next()) {
                workersArray.put(buildWorkerObject(rs, false));
            }
            sendResponse(exchange, 200, workersArray.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Internal server error\"}");
        }
    }

    private void handleGetWorkerById(HttpExchange exchange, int workerId) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql =
                "SELECT u.id, u.name, u.email, u.city, u.phone, u.dob, " +
                "w.worker_id, w.category, w.rating, w.whatsapp, w.cnic, w.approval_status " +
                "FROM users u JOIN workers w ON u.id = w.user_id " +
                "WHERE w.worker_id = ?";

            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, workerId);
            ResultSet rs = pstmt.executeQuery();

            if (!rs.next()) {
                sendResponse(exchange, 404, "{\"error\":\"Worker not found\"}");
                return;
            }

            JSONObject worker = buildWorkerObject(rs, true);

            // Also fetch services
            PreparedStatement sps = conn.prepareStatement(
                "SELECT service_id, title, description, price FROM services WHERE worker_id = ?");
            sps.setInt(1, workerId);
            ResultSet srs = sps.executeQuery();
            JSONArray services = new JSONArray();
            while (srs.next()) {
                JSONObject svc = new JSONObject();
                svc.put("serviceId",   srs.getInt("service_id"));
                svc.put("title",       srs.getString("title"));
                svc.put("description", srs.getString("description") != null ? srs.getString("description") : "");
                svc.put("price",       srs.getDouble("price"));
                services.put(svc);
            }
            worker.put("services", services);

            // Fetch recent ratings
            PreparedStatement rps = conn.prepareStatement(
                "SELECT r.stars, r.review, r.created_at, u.name AS customer_name " +
                "FROM ratings r JOIN customers c ON r.customer_id = c.customer_id " +
                "JOIN users u ON c.user_id = u.id " +
                "WHERE r.worker_id = ? ORDER BY r.created_at DESC LIMIT 5");
            rps.setInt(1, workerId);
            ResultSet rrs = rps.executeQuery();
            JSONArray ratings = new JSONArray();
            while (rrs.next()) {
                JSONObject rat = new JSONObject();
                rat.put("stars",        rrs.getInt("stars"));
                rat.put("review",       rrs.getString("review") != null ? rrs.getString("review") : "");
                rat.put("createdAt",    rrs.getString("created_at"));
                rat.put("customerName", rrs.getString("customer_name"));
                ratings.put(rat);
            }
            worker.put("reviews", ratings);

            sendResponse(exchange, 200, worker.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Internal server error\"}");
        }
    }

    private JSONObject buildWorkerObject(ResultSet rs, boolean full) throws Exception {
        JSONObject w = new JSONObject();
        w.put("id",       rs.getInt("id"));
        w.put("workerId", rs.getInt("worker_id"));
        w.put("name",     rs.getString("name"));
        w.put("city",     rs.getString("city")  != null ? rs.getString("city")  : "");
        w.put("phone",    rs.getString("phone") != null ? rs.getString("phone") : "");
        w.put("category", rs.getString("category"));
        w.put("rating",   rs.getFloat("rating"));
        w.put("whatsapp", rs.getString("whatsapp") != null ? rs.getString("whatsapp") : "");
        if (full) {
            w.put("email",          rs.getString("email") != null ? rs.getString("email") : "");
            w.put("dob",            rs.getString("dob")   != null ? rs.getString("dob")   : "");
            w.put("cnic",           rs.getString("cnic")  != null ? rs.getString("cnic")  : "");
            w.put("approvalStatus", rs.getString("approval_status"));
        }
        return w;
    }
}
