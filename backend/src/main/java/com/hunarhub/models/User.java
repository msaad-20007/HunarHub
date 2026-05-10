package com.hunarhub.models;

import java.util.Date;

public abstract class User {
    protected int id;
    protected String name;
    protected String email;
    protected String password;
    protected String phone;
    protected Date dob;
    protected String city;
    protected String role; // "ADMIN", "WORKER", "CUSTOMER"

    public User() {}

    public User(int id, String name, String email, String password, String phone, Date dob, String city, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.dob = dob;
        this.city = city;
        this.role = role;
    }

    // Abstract method to demonstrate polymorphism
    public abstract String getRoleDescription();

    // Getters and setters (Encapsulation)
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Date getDob() { return dob; }
    public void setDob(Date dob) { this.dob = dob; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
