package com.hunarhub.dao;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.models.Worker;

import java.sql.*;

public class WorkerDAO {

    public int createWorker(Worker worker) {
        String sql = "INSERT INTO workers (worker_id, user_id, cnic, whatsapp, category, approval_status, rating) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            // For simplicity, worker_id = user_id
            pstmt.setInt(1, worker.getWorkerId());
            pstmt.setInt(2, worker.getId()); // from User class
            pstmt.setString(3, worker.getCnic());
            pstmt.setString(4, worker.getWhatsapp());
            pstmt.setString(5, worker.getCategory());
            pstmt.setString(6, worker.getApprovalStatus());
            pstmt.setFloat(7, worker.getRating());
            
            return pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }
}
