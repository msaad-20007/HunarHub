package com.hunarhub.dao;

import com.hunarhub.db.DatabaseConnection;
import com.hunarhub.models.User;

import java.sql.*;

public class UserDAO {

    public User getUserByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, email);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                // Using an anonymous subclass for instantiation just for basic user details, 
                // typically we'd return a specific Worker/Customer/Admin
                final String role = rs.getString("role");
                return new User(
                    rs.getInt("id"),
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("password"),
                    rs.getString("phone"),
                    rs.getDate("dob"),
                    rs.getString("city"),
                    role
                ) {
                    @Override
                    public String getRoleDescription() {
                        return role;
                    }
                };
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public int createUser(User user) {
        String sql = "INSERT INTO users (name, email, password, phone, dob, city, role) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, user.getName());
            pstmt.setString(2, user.getEmail());
            pstmt.setString(3, user.getPassword());
            pstmt.setString(4, user.getPhone());
            pstmt.setDate(5, user.getDob() != null ? new java.sql.Date(user.getDob().getTime()) : null);
            pstmt.setString(6, user.getCity());
            pstmt.setString(7, user.getRole());
            
            pstmt.executeUpdate();
            
            ResultSet rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }
}
