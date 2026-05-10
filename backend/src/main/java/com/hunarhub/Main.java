package com.hunarhub;

import com.hunarhub.api.AuthHandler;
import com.hunarhub.api.WorkerHandler;
import com.hunarhub.db.DatabaseConnection;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) {
        try {
            // Initialize database connection
            DatabaseConnection.getConnection();

            // Create HTTP server on port 8080
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

            // Setup endpoints
            server.createContext("/api/auth/register", new AuthHandler.RegisterHandler());
            server.createContext("/api/auth/login", new AuthHandler.LoginHandler());
            server.createContext("/api/workers", new WorkerHandler());
            server.createContext("/api/bookings", new com.hunarhub.api.BookingHandler());

            server.setExecutor(null); // creates a default executor
            server.start();
            System.out.println("HunarHub Backend Server started on port 8080");

            // Add shutdown hook to close db connection
            Runtime.getRuntime().addShutdownHook(new Thread(DatabaseConnection::closeConnection));

        } catch (IOException e) {
            System.err.println("Failed to start server.");
            e.printStackTrace();
        }
    }
}
