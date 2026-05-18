package com.hunarhub;

import com.hunarhub.api.AuthHandler;
import com.hunarhub.api.BookingHandler;
import com.hunarhub.api.WorkerHandler;
import com.hunarhub.api.AdminHandler;
import com.hunarhub.api.UserHandler;
import com.hunarhub.api.MessageHandler;
import com.hunarhub.db.DatabaseConnection;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) {
        try {
            // Verify database connection at startup
            try {
                DatabaseConnection.getConnection().close();
                System.out.println("✅ Database connection verified.");
            } catch (Exception dbEx) {
                System.err.println("⚠️  Database connection failed at startup: " + dbEx.getMessage());
                // Continue anyway — individual requests will fail gracefully
            }

            // Create HTTP server on port 8080
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

            // ── Auth ──────────────────────────────────────────────────────────
            server.createContext("/api/auth/register", new AuthHandler.RegisterHandler());
            server.createContext("/api/auth/login",    new AuthHandler.LoginHandler());

            // ── Workers ───────────────────────────────────────────────────────
            // /api/workers prefix-matches /api/workers and /api/workers/{id}
            server.createContext("/api/workers", new WorkerHandler());

            // ── Bookings ──────────────────────────────────────────────────────
            // Single handler routes all /api/bookings/* internally
            server.createContext("/api/bookings", new BookingHandler());

            // ── Users ─────────────────────────────────────────────────────────
            server.createContext("/api/users/", new UserHandler());

            // ── Messages ──────────────────────────────────────────────────────
            server.createContext("/api/messages", new MessageHandler());

            // ── Admin ─────────────────────────────────────────────────────────
            server.createContext("/api/admin/stats",           new AdminHandler.StatsHandler());
            server.createContext("/api/admin/workers/pending", new AdminHandler.PendingWorkersHandler());
            server.createContext("/api/admin/workers/all",     new AdminHandler.AllWorkersHandler());
            server.createContext("/api/admin/workers/approve", new AdminHandler.ApproveWorkerHandler());
            server.createContext("/api/admin/customers",       new AdminHandler.AllCustomersHandler());
            server.createContext("/api/admin/users/delete",    new AdminHandler.DeleteUserHandler());
            server.createContext("/api/admin/bookings",        new AdminHandler.AllBookingsHandler());

            server.setExecutor(null);
            server.start();
            System.out.println("✅ HunarHub Backend started on port 8080");

            Runtime.getRuntime().addShutdownHook(new Thread(() ->
                System.out.println("Server shutting down...")));

        } catch (IOException e) {
            System.err.println("Failed to start server.");
            e.printStackTrace();
        }
    }
}
