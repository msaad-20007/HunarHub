package com.hunarhub.dao;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.models.Worker;

import java.sql.*;

public class WorkerDAO {

    public int createWorker(Worker worker) {
        // First resolve category name → category_id
        String lookupSql = "SELECT category_id FROM categories WHERE category_name = ?";
        int categoryId = -1;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement lookup = conn.prepareStatement(lookupSql)) {
            lookup.setString(1, worker.getCategory());
            ResultSet rs = lookup.executeQuery();
            if (rs.next()) {
                categoryId = rs.getInt("category_id");
            } else {
                System.err.println("Category not found: " + worker.getCategory());
                return -1;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }

        String sql = "INSERT INTO workers (user_id, cnic, whatsapp, category_id, approval_status, rating) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, worker.getId()); // user_id
            pstmt.setString(2, worker.getCnic());
            pstmt.setString(3, worker.getWhatsapp());
            pstmt.setInt(4, categoryId);
            pstmt.setString(5, worker.getApprovalStatus());
            pstmt.setFloat(6, worker.getRating());

            return pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }
}
