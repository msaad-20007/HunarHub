package com.hunarhub.models;

import java.util.Date;

public class Customer extends User {
    private int customerId;

    public Customer() {
        super();
        this.role = "CUSTOMER";
    }

    public Customer(int id, String name, String email, String password, String phone, Date dob, String city, int customerId) {
        super(id, name, email, password, phone, dob, city, "CUSTOMER");
        this.customerId = customerId;
    }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    @Override
    public String getRoleDescription() {
        return "Customer - Searches for and books workers for services.";
    }
}
