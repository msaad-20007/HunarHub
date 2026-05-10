package com.hunarhub.dao;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.models.Customer;

import java.sql.*;

public class CustomerDAO {

    public int createCustomer(Customer customer) {
        String sql = "INSERT INTO customers (customer_id, user_id) VALUES (?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, customer.getCustomerId());
            pstmt.setInt(2, customer.getId());
            
            return pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }
}
