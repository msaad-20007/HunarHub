package com.hunarhub.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String DB_URL;
    private static final String DB_USER;
    private static final String DB_PASSWORD;

    static {
        // Railway provides MYSQL_URL, MYSQLUSER, MYSQLPASSWORD env vars
        // Fallback to localhost for local development
        String mysqlUrl = System.getenv("MYSQL_URL");
        if (mysqlUrl != null && !mysqlUrl.isEmpty()) {
            // Railway format: mysql://user:password@host:port/database
            // Convert to JDBC format
            DB_URL = mysqlUrl.replace("mysql://", "jdbc:mysql://") + "?autoReconnect=true&useSSL=false&serverTimezone=UTC";
            DB_USER = System.getenv("MYSQLUSER") != null ? System.getenv("MYSQLUSER") : "root";
            DB_PASSWORD = System.getenv("MYSQLPASSWORD") != null ? System.getenv("MYSQLPASSWORD") : "";
        } else {
            // Local development fallback
            DB_URL = "jdbc:mysql://localhost:3306/hunarhub?autoReconnect=true&useSSL=false&serverTimezone=UTC";
            DB_USER = "root";
            DB_PASSWORD = "";
        }
    }

    private DatabaseConnection() {}

    // Returns a NEW connection every time — caller must close it (use try-with-resources)
    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC driver not found", e);
        } catch (SQLException e) {
            System.err.println("Failed to connect to the database.");
            e.printStackTrace();
            throw e;
        }
    }
}
