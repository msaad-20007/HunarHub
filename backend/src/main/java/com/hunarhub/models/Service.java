package com.hunarhub.models;

public class Service {
    private int serviceId;
    private int workerId;
    private String title;
    private String description;
    private double price;

    public Service() {}

    public Service(int serviceId, int workerId, String title, String description, double price) {
        this.serviceId = serviceId;
        this.workerId = workerId;
        this.title = title;
        this.description = description;
        this.price = price;
    }

    // Getters and Setters
    public int getServiceId() { return serviceId; }
    public void setServiceId(int serviceId) { this.serviceId = serviceId; }

    public int getWorkerId() { return workerId; }
    public void setWorkerId(int workerId) { this.workerId = workerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
