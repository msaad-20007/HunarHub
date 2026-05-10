package com.hunarhub.models;

import java.util.Date;

public class Worker extends User {
    private int workerId;
    private String cnic;
    private String whatsapp;
    private String category;
    private String approvalStatus; // "PENDING", "APPROVED", "REJECTED"
    private float rating;

    public Worker() {
        super();
        this.role = "WORKER";
    }

    public Worker(int id, String name, String email, String password, String phone, Date dob, String city,
                  int workerId, String cnic, String whatsapp, String category, String approvalStatus, float rating) {
        super(id, name, email, password, phone, dob, city, "WORKER");
        this.workerId = workerId;
        this.cnic = cnic;
        this.whatsapp = whatsapp;
        this.category = category;
        this.approvalStatus = approvalStatus;
        this.rating = rating;
    }

    // Getters and Setters
    public int getWorkerId() { return workerId; }
    public void setWorkerId(int workerId) { this.workerId = workerId; }

    public String getCnic() { return cnic; }
    public void setCnic(String cnic) { this.cnic = cnic; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public float getRating() { return rating; }
    public void setRating(float rating) { this.rating = rating; }

    @Override
    public String getRoleDescription() {
        return "Worker - Provides services (" + category + ") to customers.";
    }
}
