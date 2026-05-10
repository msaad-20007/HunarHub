package com.hunarhub.models;

import java.util.Date;

public class Admin extends User {

    public Admin() {
        super();
        this.role = "ADMIN";
    }

    public Admin(int id, String name, String email, String password, String phone, Date dob, String city) {
        super(id, name, email, password, phone, dob, city, "ADMIN");
    }

    @Override
    public String getRoleDescription() {
        return "System Administrator - Manages workers, customers, and bookings.";
    }
}
