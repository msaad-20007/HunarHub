-- ============================================================
--  HunarHub Database Schema
--  Designed for: Database Systems Project (3NF Compliant)
--  Includes: Composite Attributes, Weak Entity, M:N Relations,
--            Triggers, Indexes, Stored Procedures
--  Version: 2.0 — Premium Level
-- ============================================================

CREATE DATABASE IF NOT EXISTS hunarhub;
USE hunarhub;

-- ============================================================
-- TABLE 1: users
-- Central entity. All roles (ADMIN, WORKER, CUSTOMER) stored here.
-- Composite Attribute: address (street + city + zip_code)
-- Multi-valued Attribute: phone_numbers (separate table)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(255)  NOT NULL,
    email          VARCHAR(255)  UNIQUE NOT NULL,
    password       VARCHAR(255)  NOT NULL,
    phone          VARCHAR(20),
    dob            DATE,
    -- Composite Attribute: address decomposed into atomic parts (1NF)
    address_street VARCHAR(255),
    address_city   VARCHAR(100),
    address_zip    VARCHAR(20),
    role           ENUM('ADMIN', 'WORKER', 'CUSTOMER') NOT NULL,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: user_phone_numbers
-- Multi-valued Attribute: A user can have multiple phone numbers.
-- Stored in a separate table to maintain 1NF (no repeating groups).
-- ============================================================
CREATE TABLE IF NOT EXISTS user_phone_numbers (
    phone_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    phone      VARCHAR(20) NOT NULL,
    label      ENUM('MOBILE', 'HOME', 'WORK', 'WHATSAPP') DEFAULT 'MOBILE',
    UNIQUE KEY uq_user_phone (user_id, phone),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 3: categories
-- Master list of service categories.
-- Workers are assigned one category (FK).
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description   TEXT,
    icon_name     VARCHAR(50),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: workers
-- Specialization of users (role = WORKER).
-- 1:1 with users via user_id.
-- category_id FK references categories table (proper normalization).
-- ============================================================
CREATE TABLE IF NOT EXISTS workers (
    worker_id       INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT UNIQUE NOT NULL,
    cnic            VARCHAR(20) UNIQUE NOT NULL,
    whatsapp        VARCHAR(20),
    category_id     INT NOT NULL,
    experience_years INT DEFAULT 0,
    bio             TEXT,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rating          FLOAT DEFAULT 0.0,
    total_jobs      INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(id)           ON DELETE CASCADE,
    FOREIGN KEY (category_id)  REFERENCES categories(category_id) ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 5: worker_skills
-- Multi-valued / Composite Attribute for workers.
-- A worker can have multiple skills with proficiency levels.
-- Stored separately to maintain 1NF and 2NF.
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_skills (
    skill_id    INT AUTO_INCREMENT PRIMARY KEY,
    worker_id   INT NOT NULL,
    skill_name  VARCHAR(100) NOT NULL,
    proficiency ENUM('BEGINNER', 'INTERMEDIATE', 'EXPERT') DEFAULT 'INTERMEDIATE',
    UNIQUE KEY uq_worker_skill (worker_id, skill_name),
    FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: customers
-- Specialization of users (role = CUSTOMER).
-- 1:1 with users via user_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id    INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT UNIQUE NOT NULL,
    loyalty_points INT DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 7: services
-- WEAK ENTITY — depends on workers for identity.
-- A service cannot exist without a worker.
-- Partial key: service_id (auto-increment within worker scope)
-- Identifying relationship: WORKER —[OFFERS]—> SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    service_id  INT AUTO_INCREMENT,
    worker_id   INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(10, 2) NOT NULL,
    duration_hrs DECIMAL(4, 1),                -- estimated hours
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Weak entity: composite PK includes the owner (worker_id)
    PRIMARY KEY (service_id, worker_id),
    UNIQUE KEY uq_worker_service (worker_id, title),
    FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 8: bookings
-- M:N relationship between customers and workers.
-- Resolved via this associative/bridge table.
-- service_id references composite PK of services (weak entity).
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    worker_id       INT NOT NULL,
    service_id      INT,
    service_worker_id INT,                     -- needed for composite FK to services
    type            ENUM('NORMAL', 'ADVANCE', 'URGENT') DEFAULT 'NORMAL',
    booking_date    DATETIME NOT NULL,
    scheduled_time  TIME,
    status          ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    notes           TEXT,
    total_amount    DECIMAL(10, 2),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id)                        REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id)                          REFERENCES workers(worker_id)     ON DELETE CASCADE,
    FOREIGN KEY (service_id, service_worker_id)      REFERENCES services(service_id, worker_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 9: ratings
-- M:N between customers and workers (one customer can rate
-- multiple workers; one worker can be rated by many customers).
-- One rating per booking (enforced by UNIQUE constraint).
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
    rating_id   INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    worker_id   INT NOT NULL,
    booking_id  INT,
    stars       TINYINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_rating_per_booking (customer_id, worker_id, booking_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id)   REFERENCES workers(worker_id)     ON DELETE CASCADE,
    FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id)   ON DELETE SET NULL
);

-- ============================================================
-- TABLE 10: messages
-- M:N self-referencing on users (sender ↔ receiver).
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    message_id  INT AUTO_INCREMENT PRIMARY KEY,
    sender_id   INT NOT NULL,
    receiver_id INT NOT NULL,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: notifications
-- Tracks system notifications per user.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    type            VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 12: audit_log
-- Tracks important system events for admin review.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(50),
    record_id   INT,
    old_value   TEXT,
    new_value   TEXT,
    logged_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES — for query performance
-- ============================================================
CREATE INDEX idx_workers_category    ON workers(category_id);
CREATE INDEX idx_workers_status      ON workers(approval_status);
CREATE INDEX idx_bookings_customer   ON bookings(customer_id);
CREATE INDEX idx_bookings_worker     ON bookings(worker_id);
CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_date       ON bookings(booking_date);
CREATE INDEX idx_ratings_worker      ON ratings(worker_id);
CREATE INDEX idx_messages_sender     ON messages(sender_id);
CREATE INDEX idx_messages_receiver   ON messages(receiver_id);
CREATE INDEX idx_notifications_user  ON notifications(user_id, is_read);

-- ============================================================
-- TRIGGER 1: After a rating is inserted or updated,
--            automatically recalculate the worker's average rating
--            and update workers.rating (derived attribute).
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_update_worker_rating_after_insert
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
    UPDATE workers
    SET rating = (
        SELECT ROUND(AVG(stars), 2)
        FROM ratings
        WHERE worker_id = NEW.worker_id
    )
    WHERE worker_id = NEW.worker_id;
END$$

CREATE TRIGGER trg_update_worker_rating_after_update
AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
    UPDATE workers
    SET rating = (
        SELECT ROUND(AVG(stars), 2)
        FROM ratings
        WHERE worker_id = NEW.worker_id
    )
    WHERE worker_id = NEW.worker_id;
END$$

-- ============================================================
-- TRIGGER 2: After a booking is marked COMPLETED,
--            increment the worker's total_jobs counter.
-- ============================================================
CREATE TRIGGER trg_increment_worker_jobs
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        UPDATE workers
        SET total_jobs = total_jobs + 1
        WHERE worker_id = NEW.worker_id;
    END IF;
END$$

-- ============================================================
-- TRIGGER 3: Log every booking status change to audit_log.
-- ============================================================
CREATE TRIGGER trg_audit_booking_status
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO audit_log (action, table_name, record_id, old_value, new_value)
        VALUES ('STATUS_CHANGE', 'bookings', NEW.booking_id, OLD.status, NEW.status);
    END IF;
END$$

-- ============================================================
-- STORED PROCEDURE 1: Get full worker profile with stats
-- ============================================================
CREATE PROCEDURE sp_get_worker_profile(IN p_worker_id INT)
BEGIN
    SELECT
        w.worker_id,
        u.name,
        u.email,
        u.phone,
        u.address_street,
        u.address_city,
        u.address_zip,
        c.category_name,
        w.experience_years,
        w.bio,
        w.approval_status,
        ROUND(w.rating, 2)              AS avg_rating,
        w.total_jobs,
        COUNT(DISTINCT r.rating_id)     AS review_count,
        COUNT(DISTINCT s.service_id)    AS service_count
    FROM workers w
    JOIN users      u ON w.user_id     = u.id
    JOIN categories c ON w.category_id = c.category_id
    LEFT JOIN ratings  r ON w.worker_id = r.worker_id
    LEFT JOIN services s ON w.worker_id = s.worker_id AND s.is_active = TRUE
    WHERE w.worker_id = p_worker_id
    GROUP BY w.worker_id, u.name, u.email, u.phone,
             u.address_street, u.address_city, u.address_zip,
             c.category_name, w.experience_years, w.bio,
             w.approval_status, w.rating, w.total_jobs;
END$$

-- ============================================================
-- STORED PROCEDURE 2: Admin dashboard summary
-- ============================================================
CREATE PROCEDURE sp_admin_dashboard()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM users    WHERE role = 'CUSTOMER')              AS total_customers,
        (SELECT COUNT(*) FROM users    WHERE role = 'WORKER')                AS total_workers,
        (SELECT COUNT(*) FROM workers  WHERE approval_status = 'APPROVED')   AS approved_workers,
        (SELECT COUNT(*) FROM workers  WHERE approval_status = 'PENDING')    AS pending_workers,
        (SELECT COUNT(*) FROM bookings)                                      AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'COMPLETED')           AS completed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING')             AS pending_bookings,
        (SELECT ROUND(AVG(stars), 2)   FROM ratings)                         AS platform_avg_rating,
        (SELECT COUNT(*) FROM messages WHERE is_read = FALSE)                AS unread_messages,
        (SELECT SUM(total_amount) FROM bookings WHERE status = 'COMPLETED')  AS total_revenue;
END$$

DELIMITER ;

-- ============================================================
-- VIEWS
-- ============================================================

-- View 1: Worker public profile (used by customer-facing screens)
CREATE OR REPLACE VIEW vw_worker_profiles AS
SELECT
    w.worker_id,
    u.name,
    u.email,
    u.phone,
    u.address_city                 AS city,
    c.category_name                AS category,
    w.whatsapp,
    w.experience_years,
    w.bio,
    w.approval_status,
    ROUND(w.rating, 1)             AS rating,
    w.total_jobs,
    COUNT(DISTINCT b.booking_id)   AS total_bookings,
    COUNT(DISTINCT r.rating_id)    AS total_reviews
FROM workers w
JOIN  categories c  ON w.category_id  = c.category_id
JOIN  users      u  ON w.user_id      = u.id
LEFT JOIN bookings b  ON w.worker_id  = b.worker_id
LEFT JOIN ratings  r  ON w.worker_id  = r.worker_id
WHERE w.approval_status = 'APPROVED'
GROUP BY w.worker_id, u.name, u.email, u.phone,
         u.address_city, c.category_name, w.whatsapp,
         w.experience_years, w.bio, w.approval_status,
         w.rating, w.total_jobs;

-- View 2: Booking summary with all details
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
    COALESCE(s.price, 0.00)              AS price,
    b.total_amount,
    b.created_at
FROM bookings b
JOIN customers  c   ON b.customer_id = c.customer_id
JOIN users      cu  ON c.user_id     = cu.id
JOIN workers    w   ON b.worker_id   = w.worker_id
JOIN users      wu  ON w.user_id     = wu.id
JOIN categories cat ON w.category_id = cat.category_id
LEFT JOIN services s ON b.service_id = s.service_id
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
    (SELECT SUM(total_amount) FROM bookings WHERE status = 'COMPLETED')  AS total_revenue;

-- View 4: Unread message threads per user
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

-- ============================================================
-- SEED DATA: Categories
-- ============================================================
INSERT IGNORE INTO categories (category_name, description, icon_name) VALUES
    ('Plumber',     'Water pipe installation, repair, and maintenance',       'water'),
    ('Electrician', 'Electrical wiring, fuse boxes, and appliance repair',    'flash'),
    ('Painter',     'Interior and exterior painting services',                'brush'),
    ('AC Repair',   'Air conditioner installation, servicing, and repair',    'snow'),
    ('Carpenter',   'Furniture making, repair, and woodwork',                 'hammer'),
    ('Mechanic',    'Vehicle repair and maintenance',                         'car'),
    ('Welder',      'Metal welding and fabrication',                          'flame'),
    ('Qasai',       'Meat cutting and butchery services',                     'restaurant');

-- ============================================================
-- SEED DATA: Default Admin user
-- ============================================================
INSERT IGNORE INTO users (id, name, email, password, role, address_city)
VALUES (1, 'Admin', 'admin@hunarhub.com', 'admin123', 'ADMIN', 'Rawalpindi');
