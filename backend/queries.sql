-- ============================================================
--  HunarHub — Premium SQL Queries
--  Covers: SELECT, JOIN, AGGREGATE, Subqueries, CTEs,
--          Window Functions, Views, Stored Procedures
--  For: Database Systems Project — Premium Level
-- ============================================================

USE hunarhub;

-- ============================================================
-- SECTION 1: BASIC SELECT QUERIES
-- ============================================================

-- Q1: Get all approved workers with full composite address
SELECT
    u.id,
    u.name,
    u.email,
    u.phone,
    CONCAT_WS(', ', u.address_street, u.address_city, u.address_zip) AS full_address,
    cat.category_name,
    w.experience_years,
    w.rating,
    w.total_jobs,
    w.approval_status
FROM users u
JOIN workers    w   ON u.id          = w.user_id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.approval_status = 'APPROVED'
ORDER BY w.rating DESC, w.total_jobs DESC;

-- Q2: Get all customers with their contact info and loyalty points
SELECT
    u.id          AS user_id,
    c.customer_id,
    u.name,
    u.email,
    u.phone,
    u.address_city,
    c.loyalty_points,
    u.created_at  AS member_since
FROM users u
JOIN customers c ON u.id = c.user_id
ORDER BY c.loyalty_points DESC, u.name ASC;

-- Q3: Get all pending workers awaiting admin approval
SELECT
    u.name,
    u.email,
    u.phone,
    u.address_city,
    w.worker_id,
    w.cnic,
    cat.category_name,
    w.whatsapp,
    w.experience_years,
    w.created_at AS applied_on
FROM users u
JOIN workers    w   ON u.id          = w.user_id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.approval_status = 'PENDING'
ORDER BY w.created_at ASC;

-- Q4: Get all active services offered by a specific worker (worker_id = 1)
SELECT
    s.service_id,
    s.title,
    s.description,
    s.price,
    s.duration_hrs,
    u.name       AS worker_name,
    cat.category_name
FROM services s
JOIN workers    w   ON s.worker_id   = w.worker_id
JOIN users      u   ON w.user_id     = u.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE s.worker_id = 1
  AND s.is_active = TRUE
ORDER BY s.price ASC;

-- Q5: Get all bookings with current status and amounts
SELECT
    b.booking_id,
    b.type,
    b.booking_date,
    b.status,
    b.total_amount,
    cu.name       AS customer_name,
    wu.name       AS worker_name,
    cat.category_name
FROM bookings b
JOIN customers  c   ON b.customer_id = c.customer_id
JOIN users      cu  ON c.user_id     = cu.id
JOIN workers    w   ON b.worker_id   = w.worker_id
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
ORDER BY b.booking_date DESC;


-- ============================================================
-- SECTION 2: JOIN QUERIES
-- ============================================================

-- Q6: INNER JOIN — Bookings with full customer and worker details
SELECT
    b.booking_id,
    b.type                               AS booking_type,
    b.booking_date,
    b.status,
    cu.name                              AS customer_name,
    cu.email                             AS customer_email,
    cu.address_city                      AS customer_city,
    wu.name                              AS worker_name,
    wu.phone                             AS worker_phone,
    cat.category_name                    AS service_category,
    COALESCE(s.title, 'General Service') AS service_title,
    COALESCE(s.price, 0)                 AS service_price,
    b.total_amount
FROM bookings b
INNER JOIN customers  c   ON b.customer_id       = c.customer_id
INNER JOIN users      cu  ON c.user_id           = cu.id
INNER JOIN workers    w   ON b.worker_id         = w.worker_id
INNER JOIN users      wu  ON w.user_id           = wu.id
INNER JOIN categories cat ON w.category_id       = cat.category_id
LEFT  JOIN services   s   ON b.service_id        = s.service_id
                          AND b.service_worker_id = s.worker_id
ORDER BY b.booking_date DESC;

-- Q7: LEFT JOIN — All workers and their booking stats (including workers with no bookings)
SELECT
    wu.name           AS worker_name,
    cat.category_name AS category,
    w.approval_status,
    w.rating,
    COUNT(b.booking_id)                                          AS total_bookings,
    SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END)     AS completed,
    SUM(CASE WHEN b.status = 'PENDING'   THEN 1 ELSE 0 END)     AS pending,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END)     AS cancelled,
    COALESCE(SUM(b.total_amount), 0)                             AS total_revenue
FROM workers w
JOIN  users      wu  ON w.user_id     = wu.id
JOIN  categories cat ON w.category_id = cat.category_id
LEFT JOIN bookings b ON w.worker_id   = b.worker_id
GROUP BY w.worker_id, wu.name, cat.category_name, w.approval_status, w.rating
ORDER BY total_bookings DESC;

-- Q8: LEFT JOIN — All customers and their booking history
SELECT
    cu.name                                                      AS customer_name,
    cu.address_city,
    c.loyalty_points,
    COUNT(b.booking_id)                                          AS total_bookings,
    SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END)     AS completed_bookings,
    COALESCE(SUM(b.total_amount), 0)                             AS total_spent,
    MAX(b.booking_date)                                          AS last_booking_date
FROM customers c
JOIN  users    cu ON c.user_id     = cu.id
LEFT JOIN bookings b  ON c.customer_id = b.customer_id
GROUP BY c.customer_id, cu.name, cu.address_city, c.loyalty_points
ORDER BY total_spent DESC;

-- Q9: SELF JOIN on messages — Show full conversations with names
SELECT
    m.message_id,
    s.name      AS sender_name,
    r.name      AS receiver_name,
    m.content,
    m.sent_at,
    m.is_read
FROM messages m
JOIN users s ON m.sender_id   = s.id
JOIN users r ON m.receiver_id = r.id
ORDER BY m.sent_at DESC;

-- Q10: JOIN with ratings — Workers with full rating breakdown
SELECT
    wu.name                AS worker_name,
    cat.category_name      AS category,
    wu.address_city,
    COUNT(r.rating_id)     AS total_reviews,
    ROUND(AVG(r.stars), 2) AS average_rating,
    MIN(r.stars)           AS lowest_rating,
    MAX(r.stars)           AS highest_rating,
    SUM(CASE WHEN r.stars = 5 THEN 1 ELSE 0 END) AS five_star_count,
    SUM(CASE WHEN r.stars = 1 THEN 1 ELSE 0 END) AS one_star_count
FROM workers w
JOIN  users      wu  ON w.user_id     = wu.id
JOIN  categories cat ON w.category_id = cat.category_id
LEFT JOIN ratings r  ON w.worker_id   = r.worker_id
GROUP BY w.worker_id, wu.name, cat.category_name, wu.address_city
ORDER BY average_rating DESC;


-- ============================================================
-- SECTION 3: AGGREGATE QUERIES
-- ============================================================

-- Q11: Total bookings per booking type with completion rate
SELECT
    type                                                          AS booking_type,
    COUNT(*)                                                      AS total_bookings,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)        AS completed,
    SUM(CASE WHEN status = 'PENDING'   THEN 1 ELSE 0 END)        AS pending,
    SUM(CASE WHEN status = 'REJECTED'  THEN 1 ELSE 0 END)        AS rejected,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)        AS cancelled,
    ROUND(
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)
        / COUNT(*) * 100, 1
    )                                                             AS completion_rate_pct
FROM bookings
GROUP BY type
ORDER BY total_bookings DESC;

-- Q12: Revenue per worker (completed bookings only)
SELECT
    wu.name              AS worker_name,
    cat.category_name    AS category,
    COUNT(b.booking_id)  AS completed_jobs,
    SUM(b.total_amount)  AS total_revenue_pkr,
    ROUND(AVG(b.total_amount), 2) AS avg_job_value
FROM bookings b
JOIN workers    w   ON b.worker_id   = w.worker_id
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE b.status = 'COMPLETED'
GROUP BY w.worker_id, wu.name, cat.category_name
ORDER BY total_revenue_pkr DESC;

-- Q13: Most popular service categories by booking count and revenue
SELECT
    cat.category_name,
    COUNT(b.booking_id)           AS total_bookings,
    COUNT(DISTINCT b.customer_id) AS unique_customers,
    COUNT(DISTINCT b.worker_id)   AS active_workers,
    ROUND(AVG(r.stars), 2)        AS avg_category_rating,
    COALESCE(SUM(b.total_amount), 0) AS total_revenue
FROM categories cat
LEFT JOIN workers  w  ON cat.category_id = w.category_id
LEFT JOIN bookings b  ON w.worker_id     = b.worker_id
LEFT JOIN ratings  r  ON w.worker_id     = r.worker_id
GROUP BY cat.category_id, cat.category_name
ORDER BY total_bookings DESC;

-- Q14: Platform-wide statistics (admin dashboard summary)
SELECT
    (SELECT COUNT(*) FROM users    WHERE role = 'CUSTOMER')              AS total_customers,
    (SELECT COUNT(*) FROM workers  WHERE approval_status = 'APPROVED')   AS approved_workers,
    (SELECT COUNT(*) FROM workers  WHERE approval_status = 'PENDING')    AS pending_workers,
    (SELECT COUNT(*) FROM bookings)                                      AS total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'COMPLETED')           AS completed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING')             AS pending_bookings,
    (SELECT ROUND(AVG(stars), 2)   FROM ratings)                         AS platform_avg_rating,
    (SELECT COUNT(*) FROM messages)                                      AS total_messages,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings
     WHERE status = 'COMPLETED')                                         AS total_platform_revenue;

-- Q15: Top 5 highest-rated workers (minimum 3 reviews)
SELECT
    wu.name                        AS worker_name,
    cat.category_name              AS category,
    wu.address_city                AS city,
    COUNT(r.rating_id)             AS review_count,
    ROUND(AVG(r.stars), 2)         AS avg_rating,
    w.total_jobs
FROM workers w
JOIN  users      wu  ON w.user_id     = wu.id
JOIN  categories cat ON w.category_id = cat.category_id
JOIN  ratings    r   ON w.worker_id   = r.worker_id
GROUP BY w.worker_id, wu.name, cat.category_name, wu.address_city, w.total_jobs
HAVING COUNT(r.rating_id) >= 3
ORDER BY avg_rating DESC, review_count DESC
LIMIT 5;

-- Q16: Workers with URGENT bookings in the last 30 days
SELECT
    wu.name              AS worker_name,
    cat.category_name    AS category,
    wu.phone,
    COUNT(b.booking_id)  AS urgent_bookings,
    SUM(b.total_amount)  AS urgent_revenue
FROM bookings b
JOIN workers    w   ON b.worker_id   = w.worker_id
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE b.type = 'URGENT'
  AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY w.worker_id, wu.name, cat.category_name, wu.phone
ORDER BY urgent_bookings DESC;

-- Q17: Customers who have booked more than once (loyal customers)
SELECT
    cu.name              AS customer_name,
    cu.email,
    cu.address_city,
    c.loyalty_points,
    COUNT(b.booking_id)  AS booking_count,
    SUM(b.total_amount)  AS total_spent
FROM customers c
JOIN users     cu ON c.user_id     = cu.id
JOIN bookings  b  ON c.customer_id = b.customer_id
GROUP BY c.customer_id, cu.name, cu.email, cu.address_city, c.loyalty_points
HAVING COUNT(b.booking_id) > 1
ORDER BY booking_count DESC;

-- Q18: Average booking count and revenue per city
SELECT
    wu.address_city                                              AS city,
    COUNT(DISTINCT w.worker_id)                                  AS worker_count,
    COUNT(b.booking_id)                                          AS total_bookings,
    ROUND(COUNT(b.booking_id) / COUNT(DISTINCT w.worker_id), 2) AS avg_bookings_per_worker,
    COALESCE(SUM(b.total_amount), 0)                             AS city_revenue
FROM workers w
JOIN users    wu ON w.user_id   = wu.id
LEFT JOIN bookings b ON w.worker_id = b.worker_id
WHERE w.approval_status = 'APPROVED'
GROUP BY wu.address_city
ORDER BY city_revenue DESC;


-- ============================================================
-- SECTION 4: SUBQUERIES
-- ============================================================

-- Q19: Workers whose rating is above platform average
SELECT
    wu.name,
    cat.category_name,
    wu.address_city,
    w.rating,
    w.total_jobs
FROM workers w
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.rating > (
    SELECT AVG(rating) FROM workers WHERE approval_status = 'APPROVED'
)
ORDER BY w.rating DESC;

-- Q20: Customers who have never made a booking
SELECT
    cu.name,
    cu.email,
    cu.address_city,
    cu.created_at AS joined_on
FROM customers c
JOIN users cu ON c.user_id = cu.id
WHERE c.customer_id NOT IN (
    SELECT DISTINCT customer_id FROM bookings
);

-- Q21: Most expensive service per category
SELECT
    cat.category_name,
    s.title,
    s.price,
    wu.name AS worker_name
FROM services s
JOIN workers    w   ON s.worker_id   = w.worker_id
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE s.price = (
    SELECT MAX(s2.price)
    FROM services s2
    JOIN workers w2 ON s2.worker_id = w2.worker_id
    WHERE w2.category_id = w.category_id
      AND s2.is_active = TRUE
)
ORDER BY s.price DESC;

-- Q22: Workers who have completed more bookings than the average worker
SELECT
    wu.name,
    cat.category_name,
    w.total_jobs
FROM workers w
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.total_jobs > (
    SELECT AVG(total_jobs) FROM workers WHERE approval_status = 'APPROVED'
)
ORDER BY w.total_jobs DESC;

-- Q23: Customers who have booked every available category (power users)
SELECT
    cu.name,
    cu.email,
    COUNT(DISTINCT cat.category_id) AS categories_booked
FROM customers c
JOIN users      cu  ON c.user_id     = cu.id
JOIN bookings   b   ON c.customer_id = b.customer_id
JOIN workers    w   ON b.worker_id   = w.worker_id
JOIN categories cat ON w.category_id = cat.category_id
GROUP BY c.customer_id, cu.name, cu.email
HAVING COUNT(DISTINCT cat.category_id) = (
    SELECT COUNT(*) FROM categories
);


-- ============================================================
-- SECTION 5: CTEs (Common Table Expressions)
-- ============================================================

-- Q24: CTE — Monthly booking trend for the current year
WITH monthly_bookings AS (
    SELECT
        MONTH(booking_date)  AS month_num,
        MONTHNAME(booking_date) AS month_name,
        COUNT(*)             AS total_bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
        COALESCE(SUM(total_amount), 0) AS revenue
    FROM bookings
    WHERE YEAR(booking_date) = YEAR(CURDATE())
    GROUP BY MONTH(booking_date), MONTHNAME(booking_date)
)
SELECT
    month_name,
    total_bookings,
    completed,
    revenue,
    ROUND(completed / total_bookings * 100, 1) AS completion_rate_pct
FROM monthly_bookings
ORDER BY month_num;

-- Q25: CTE — Worker performance tier classification
WITH worker_stats AS (
    SELECT
        w.worker_id,
        wu.name,
        cat.category_name,
        w.rating,
        w.total_jobs,
        COUNT(r.rating_id) AS review_count
    FROM workers w
    JOIN users      wu  ON w.user_id     = wu.id
    JOIN categories cat ON w.category_id = cat.category_id
    LEFT JOIN ratings r ON w.worker_id   = r.worker_id
    WHERE w.approval_status = 'APPROVED'
    GROUP BY w.worker_id, wu.name, cat.category_name, w.rating, w.total_jobs
)
SELECT
    name,
    category_name,
    rating,
    total_jobs,
    review_count,
    CASE
        WHEN rating >= 4.5 AND total_jobs >= 20 THEN 'PLATINUM'
        WHEN rating >= 4.0 AND total_jobs >= 10 THEN 'GOLD'
        WHEN rating >= 3.5 AND total_jobs >= 5  THEN 'SILVER'
        ELSE 'BRONZE'
    END AS performance_tier
FROM worker_stats
ORDER BY rating DESC, total_jobs DESC;

-- Q26: CTE — Customer spending segments (RFM-style analysis)
WITH customer_spending AS (
    SELECT
        c.customer_id,
        cu.name,
        cu.address_city,
        COUNT(b.booking_id)          AS booking_count,
        COALESCE(SUM(b.total_amount), 0) AS total_spent,
        MAX(b.booking_date)          AS last_booking
    FROM customers c
    JOIN users     cu ON c.user_id     = cu.id
    LEFT JOIN bookings b ON c.customer_id = b.customer_id
                        AND b.status = 'COMPLETED'
    GROUP BY c.customer_id, cu.name, cu.address_city
)
SELECT
    name,
    address_city,
    booking_count,
    total_spent,
    last_booking,
    CASE
        WHEN total_spent >= 50000 THEN 'VIP'
        WHEN total_spent >= 20000 THEN 'REGULAR'
        WHEN total_spent >= 5000  THEN 'OCCASIONAL'
        ELSE 'NEW'
    END AS customer_segment
FROM customer_spending
ORDER BY total_spent DESC;


-- ============================================================
-- SECTION 6: WINDOW FUNCTIONS (Advanced Analytics)
-- ============================================================

-- Q27: RANK workers by rating within each category
SELECT
    wu.name,
    cat.category_name,
    wu.address_city,
    w.rating,
    w.total_jobs,
    RANK()       OVER (PARTITION BY cat.category_id ORDER BY w.rating DESC)     AS rating_rank,
    DENSE_RANK() OVER (PARTITION BY cat.category_id ORDER BY w.total_jobs DESC) AS jobs_rank,
    ROW_NUMBER() OVER (ORDER BY w.rating DESC)                                  AS overall_rank
FROM workers w
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.approval_status = 'APPROVED';

-- Q28: Running total of bookings and revenue per day
SELECT
    DATE(booking_date)                                    AS booking_day,
    COUNT(*)                                              AS daily_bookings,
    COALESCE(SUM(total_amount), 0)                        AS daily_revenue,
    SUM(COUNT(*))       OVER (ORDER BY DATE(booking_date)) AS running_total_bookings,
    SUM(COALESCE(SUM(total_amount), 0))
                        OVER (ORDER BY DATE(booking_date)) AS running_total_revenue
FROM bookings
WHERE status = 'COMPLETED'
GROUP BY DATE(booking_date)
ORDER BY booking_day;

-- Q29: Percentile rank of each worker's rating on the platform
SELECT
    wu.name,
    cat.category_name,
    w.rating,
    ROUND(
        PERCENT_RANK() OVER (ORDER BY w.rating) * 100, 1
    ) AS percentile_rank,
    NTILE(4) OVER (ORDER BY w.rating DESC) AS quartile
FROM workers w
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
WHERE w.approval_status = 'APPROVED'
ORDER BY w.rating DESC;

-- Q30: LAG/LEAD — Compare each worker's bookings month-over-month
WITH monthly_worker_bookings AS (
    SELECT
        w.worker_id,
        wu.name                    AS worker_name,
        DATE_FORMAT(b.booking_date, '%Y-%m') AS month,
        COUNT(b.booking_id)        AS bookings_this_month
    FROM bookings b
    JOIN workers w  ON b.worker_id = w.worker_id
    JOIN users   wu ON w.user_id   = wu.id
    GROUP BY w.worker_id, wu.name, DATE_FORMAT(b.booking_date, '%Y-%m')
)
SELECT
    worker_name,
    month,
    bookings_this_month,
    LAG(bookings_this_month)  OVER (PARTITION BY worker_id ORDER BY month) AS prev_month,
    LEAD(bookings_this_month) OVER (PARTITION BY worker_id ORDER BY month) AS next_month,
    bookings_this_month -
        LAG(bookings_this_month) OVER (PARTITION BY worker_id ORDER BY month) AS month_over_month_change
FROM monthly_worker_bookings
ORDER BY worker_name, month;


-- ============================================================
-- SECTION 7: VIEWS (Reporting)
-- ============================================================

-- View 1: Worker public profile (customer-facing)
CREATE OR REPLACE VIEW vw_worker_profiles AS
SELECT
    w.worker_id,
    u.name,
    u.email,
    u.phone,
    u.address_city                 AS city,
    cat.category_name              AS category,
    w.whatsapp,
    w.experience_years,
    w.bio,
    w.approval_status,
    ROUND(w.rating, 1)             AS rating,
    w.total_jobs,
    COUNT(DISTINCT b.booking_id)   AS total_bookings,
    COUNT(DISTINCT r.rating_id)    AS total_reviews
FROM workers w
JOIN  categories cat ON w.category_id = cat.category_id
JOIN  users      u   ON w.user_id     = u.id
LEFT JOIN bookings b ON w.worker_id   = b.worker_id
LEFT JOIN ratings  r ON w.worker_id   = r.worker_id
WHERE w.approval_status = 'APPROVED'
GROUP BY w.worker_id, u.name, u.email, u.phone,
         u.address_city, cat.category_name, w.whatsapp,
         w.experience_years, w.bio, w.approval_status,
         w.rating, w.total_jobs;

-- View 2: Full booking summary
CREATE OR REPLACE VIEW vw_booking_summary AS
SELECT
    b.booking_id,
    b.type,
    b.booking_date,
    b.status,
    cu.name                              AS customer_name,
    cu.address_city                      AS customer_city,
    wu.name                              AS worker_name,
    cat.category_name                    AS category,
    COALESCE(s.title, 'General Service') AS service,
    COALESCE(s.price, 0.00)              AS service_price,
    b.total_amount,
    b.created_at
FROM bookings b
JOIN customers  c   ON b.customer_id       = c.customer_id
JOIN users      cu  ON c.user_id           = cu.id
JOIN workers    w   ON b.worker_id         = w.worker_id
JOIN users      wu  ON w.user_id           = wu.id
JOIN categories cat ON w.category_id       = cat.category_id
LEFT JOIN services s ON b.service_id       = s.service_id
                     AND b.service_worker_id = s.worker_id;

-- View 3: Admin dashboard stats
CREATE OR REPLACE VIEW vw_admin_stats AS
SELECT
    (SELECT COUNT(*) FROM users    WHERE role = 'CUSTOMER')              AS total_customers,
    (SELECT COUNT(*) FROM workers  WHERE approval_status = 'APPROVED')   AS approved_workers,
    (SELECT COUNT(*) FROM workers  WHERE approval_status = 'PENDING')    AS pending_workers,
    (SELECT COUNT(*) FROM bookings)                                      AS total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'COMPLETED')           AS completed_bookings,
    (SELECT ROUND(AVG(stars), 2)   FROM ratings)                         AS platform_avg_rating,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings
     WHERE status = 'COMPLETED')                                         AS total_revenue;

-- View 4: Unread message threads
CREATE OR REPLACE VIEW vw_unread_messages AS
SELECT
    r.id                    AS receiver_id,
    r.name                  AS receiver_name,
    s.id                    AS sender_id,
    s.name                  AS sender_name,
    COUNT(m.message_id)     AS unread_count,
    MAX(m.sent_at)          AS last_message_at
FROM messages m
JOIN users r ON m.receiver_id = r.id
JOIN users s ON m.sender_id   = s.id
WHERE m.is_read = FALSE
GROUP BY r.id, r.name, s.id, s.name;
