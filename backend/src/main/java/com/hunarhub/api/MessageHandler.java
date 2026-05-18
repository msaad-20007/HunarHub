package com.hunarhub.api;

import com.hunarhub.db.DatabaseConnection;
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
 * Handles:
 *   GET  /api/messages?user1=X&user2=Y  — fetch conversation between two users
 *   POST /api/messages                  — send a message { senderId, receiverId, text }
 */
public class MessageHandler implements HttpHandler {

    private void sendResponse(HttpExchange ex, int code, String body) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            ex.sendResponseHeaders(204, -1); return;
        }
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    @Override
    public void handle(HttpExchange ex) throws IOException {
        String method = ex.getRequestMethod();
        if ("GET".equals(method)) {
            handleGet(ex);
        } else if ("POST".equals(method)) {
            handlePost(ex);
        } else {
            sendResponse(ex, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    // GET /api/messages?user1=X&user2=Y
    private void handleGet(HttpExchange ex) throws IOException {
        String query = ex.getRequestURI().getQuery(); // "user1=1&user2=2"
        if (query == null) { sendResponse(ex, 400, "{\"error\":\"Missing query params\"}"); return; }

        int user1 = 0, user2 = 0;
        for (String param : query.split("&")) {
            String[] kv = param.split("=");
            if (kv.length == 2) {
                if ("user1".equals(kv[0])) user1 = Integer.parseInt(kv[1]);
                if ("user2".equals(kv[0])) user2 = Integer.parseInt(kv[1]);
            }
        }
        if (user1 == 0 || user2 == 0) { sendResponse(ex, 400, "{\"error\":\"Invalid user IDs\"}"); return; }

        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql = "SELECT m.message_id, m.sender_id, m.receiver_id, m.text, m.timestamp, " +
                         "u.name as sender_name " +
                         "FROM messages m JOIN users u ON m.sender_id = u.id " +
                         "WHERE (m.sender_id = ? AND m.receiver_id = ?) " +
                         "   OR (m.sender_id = ? AND m.receiver_id = ?) " +
                         "ORDER BY m.timestamp ASC";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, user1); ps.setInt(2, user2);
            ps.setInt(3, user2); ps.setInt(4, user1);
            ResultSet rs = ps.executeQuery();

            JSONArray arr = new JSONArray();
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("messageId",   rs.getInt("message_id"));
                o.put("senderId",    rs.getInt("sender_id"));
                o.put("receiverId",  rs.getInt("receiver_id"));
                o.put("text",        rs.getString("text"));
                o.put("timestamp",   rs.getString("timestamp"));
                o.put("senderName",  rs.getString("sender_name"));
                arr.put(o);
            }
            sendResponse(ex, 200, arr.toString());
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(ex, 500, "{\"error\":\"Server error\"}");
        }
    }

    // POST /api/messages  body: { senderId, receiverId, text }
    private void handlePost(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody()) {
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            JSONObject json = new JSONObject(body);
            int    senderId   = json.getInt("senderId");
            int    receiverId = json.getInt("receiverId");
            String text       = json.getString("text").trim();

            if (text.isEmpty()) { sendResponse(ex, 400, "{\"error\":\"Empty message\"}"); return; }

            try (Connection conn = DatabaseConnection.getConnection()) {
                PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)",
                    java.sql.Statement.RETURN_GENERATED_KEYS);
                ps.setInt(1, senderId);
                ps.setInt(2, receiverId);
                ps.setString(3, text);
                ps.executeUpdate();

                ResultSet keys = ps.getGeneratedKeys();
                int newId = keys.next() ? keys.getInt(1) : -1;

                // Return the saved message with timestamp
                PreparedStatement fetch = conn.prepareStatement(
                    "SELECT m.message_id, m.sender_id, m.receiver_id, m.text, m.timestamp, u.name as sender_name " +
                    "FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.message_id = ?");
                fetch.setInt(1, newId);
                ResultSet rs = fetch.executeQuery();
                if (rs.next()) {
                    JSONObject saved = new JSONObject();
                    saved.put("messageId",  rs.getInt("message_id"));
                    saved.put("senderId",   rs.getInt("sender_id"));
                    saved.put("receiverId", rs.getInt("receiver_id"));
                    saved.put("text",       rs.getString("text"));
                    saved.put("timestamp",  rs.getString("timestamp"));
                    saved.put("senderName", rs.getString("sender_name"));
                    sendResponse(ex, 201, saved.toString());
                } else {
                    sendResponse(ex, 201, "{\"message\":\"Sent\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(ex, 500, "{\"error\":\"Server error\"}");
        }
    }
}
