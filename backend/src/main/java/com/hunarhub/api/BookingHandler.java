package com.hunarhub.api;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.utils.EmailSender;
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

public class BookingHandler implements HttpHandler {

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
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

    private String getRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equals(exchange.getRequestMethod())) {
            handleCreateBooking(exchange);
        } else {
            sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
        }
    }

    private void handleCreateBooking(HttpExchange exchange) throws IOException {
        try {
            String requestBody = getRequestBody(exchange);
            JSONObject json = new JSONObject(requestBody);

            int customerId = json.getInt("customerId");
            int workerId = json.getInt("workerId");
            int serviceId = json.optInt("serviceId", 0);
            String type = json.optString("type", "NORMAL"); // NORMAL, ADVANCE, URGENT

            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "INSERT INTO bookings (customer_id, worker_id, service_id, type, booking_date, status) VALUES (?, ?, ?, ?, NOW(), 'PENDING')";
                PreparedStatement pstmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, workerId);
                if (serviceId > 0) {
                    pstmt.setInt(3, serviceId);
                } else {
                    pstmt.setNull(3, java.sql.Types.INTEGER);
                }
                pstmt.setString(4, type);
                
                pstmt.executeUpdate();

                // Fetch Worker Email to notify them
                String workerSql = "SELECT email FROM users WHERE id = ?";
                PreparedStatement wstmt = conn.prepareStatement(workerSql);
                wstmt.setInt(1, workerId);
                ResultSet wrs = wstmt.executeQuery();
                if(wrs.next()) {
                    String workerEmail = wrs.getString("email");
                    String emailBody = "Hello, you have received a new " + type + " booking request on HunarHub. Please check your dashboard.";
                    EmailSender.sendEmail(workerEmail, "New Booking Request - " + type, emailBody);
                }

                sendResponse(exchange, 201, "{\"message\": \"Booking created successfully\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 400, "{\"error\": \"Invalid request format or database error\"}");
        }
    }
}
