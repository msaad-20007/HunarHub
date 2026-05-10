package com.hunarhub.models;

import java.util.Date;

public class Rating {
    private int ratingId;
    private int customerId;
    private int workerId;
    private int stars;
    private String review;
    private Date createdAt;

    public Rating() {}

    public Rating(int ratingId, int customerId, int workerId, int stars, String review, Date createdAt) {
        this.ratingId = ratingId;
        this.customerId = customerId;
        this.workerId = workerId;
        this.stars = stars;
        this.review = review;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public int getRatingId() { return ratingId; }
    public void setRatingId(int ratingId) { this.ratingId = ratingId; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public int getWorkerId() { return workerId; }
    public void setWorkerId(int workerId) { this.workerId = workerId; }

    public int getStars() { return stars; }
    public void setStars(int stars) { this.stars = stars; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
