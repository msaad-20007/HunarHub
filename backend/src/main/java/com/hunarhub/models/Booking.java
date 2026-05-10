package com.hunarhub.models;

import java.util.Date;

public class Booking {
    private int bookingId;
    private int customerId;
    private int workerId;
    private int serviceId;
    private String type; // "NORMAL", "ADVANCE", "URGENT"
    private Date bookingDate;
    private String status; // "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"

    public Booking() {}

    public Booking(int bookingId, int customerId, int workerId, int serviceId, String type, Date bookingDate, String status) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.workerId = workerId;
        this.serviceId = serviceId;
        this.type = type;
        this.bookingDate = bookingDate;
        this.status = status;
    }

    // Getters and Setters
    public int getBookingId() { return bookingId; }
    public void setBookingId(int bookingId) { this.bookingId = bookingId; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public int getWorkerId() { return workerId; }
    public void setWorkerId(int workerId) { this.workerId = workerId; }

    public int getServiceId() { return serviceId; }
    public void setServiceId(int serviceId) { this.serviceId = serviceId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Date getBookingDate() { return bookingDate; }
    public void setBookingDate(Date bookingDate) { this.bookingDate = bookingDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
