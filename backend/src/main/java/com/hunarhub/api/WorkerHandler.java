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

public class WorkerHandler implements HttpHandler {

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
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

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("GET".equals(exchange.getRequestMethod())) {
            handleGetWorkers(exchange);
        } else {
            sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
        }
    }

    private void handleGetWorkers(HttpExchange exchange) throws IOException {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql = "SELECT u.id, u.name, u.city, w.worker_id, w.category, w.rating, w.approval_status " +
                         "FROM users u JOIN workers w ON u.id = w.user_id " +
                         "WHERE w.approval_status = 'APPROVED'";
            
            PreparedStatement pstmt = conn.prepareStatement(sql);
            ResultSet rs = pstmt.executeQuery();

            JSONArray workersArray = new JSONArray();
            while (rs.next()) {
                JSONObject worker = new JSONObject();
                worker.put("id", rs.getInt("id"));
                worker.put("workerId", rs.getInt("worker_id"));
                worker.put("name", rs.getString("name"));
                worker.put("city", rs.getString("city"));
                worker.put("category", rs.getString("category"));
                worker.put("rating", rs.getFloat("rating"));
                workersArray.put(worker);
            }

            sendResponse(exchange, 200, workersArray.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\": \"Internal server error\"}");
        }
    }
}
