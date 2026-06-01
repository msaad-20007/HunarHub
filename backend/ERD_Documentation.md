# HunarHub — Entity Relationship Diagram (ERD) Documentation
## Database Systems Project — Premium Level (3NF + Weak Entity + Composite Attributes)

---

## 1. System Overview

**HunarHub** is a skilled-worker marketplace platform connecting customers with verified local workers (plumbers, electricians, painters, etc.) across Pakistani cities. Customers browse workers, book services, chat in real-time, and leave ratings. Admins manage worker approvals and platform health.

---

## 2. Business Rules

1. A **User** can be a Customer, Worker, or Admin — exactly one role at a time.
2. A **Worker** must be approved by an Admin before appearing to customers.
3. A **Worker** belongs to exactly one **Category** (FK relationship, not a plain string).
4. A **Worker** can offer multiple **Services**, but each Service belongs to exactly one Worker.
5. A **Worker** can have multiple **Skills** with proficiency levels (multi-valued attribute).
6. A **Customer** can make multiple **Bookings** with different Workers.
7. A **Worker** can receive multiple **Bookings** from different Customers.
8. A **Booking** may optionally reference a specific **Service**.
9. A **Customer** can rate a **Worker** only once per Booking (enforced by UNIQUE constraint).
10. Any two **Users** can exchange **Messages** with each other (self-referencing M:N).
11. A **Service** cannot exist without its owning **Worker** — it is a **Weak Entity**.
12. Every User has a composite **Address** (Street, City, ZIP) stored as atomic columns (1NF).
13. A User can have multiple phone numbers stored in a separate table (multi-valued attribute).
14. Worker **rating** is a derived attribute — automatically recalculated via TRIGGER on ratings insert/update.

---

## 3. Entities & Attributes

### Entity 1: USER (Strong Entity)
| Attribute | Type | Notes |
|---|---|---|
| **id** (PK) | INT | Auto-increment |
| name | VARCHAR | Full name |
| email | VARCHAR | Unique |
| password | VARCHAR | Hashed |
| phone | VARCHAR | Primary phone |
| dob | DATE | Date of birth |
| **address_street** | VARCHAR | ← Composite Attribute part 1 |
| **address_city** | VARCHAR | ← Composite Attribute part 2 |
| **address_zip** | VARCHAR | ← Composite Attribute part 3 |
| role | ENUM | ADMIN / WORKER / CUSTOMER |
| is_active | BOOLEAN | Soft delete flag |
| created_at | DATETIME | Auto timestamp |
| updated_at | DATETIME | Auto-updated on change |

> **Composite Attribute:** `address` is decomposed into `address_street`, `address_city`, `address_zip` — satisfying 1NF (no composite/multi-valued attributes in a single column).

---

### Entity 2: USER_PHONE_NUMBERS (Multi-valued Attribute Table)
| Attribute | Type | Notes |
|---|---|---|
| **phone_id** (PK) | INT | Auto-increment |
| user_id (FK) | INT | References users.id |
| phone | VARCHAR | Phone number |
| label | ENUM | MOBILE / HOME / WORK / WHATSAPP |

> **Multi-valued Attribute:** A user can have multiple phone numbers. Stored in a separate table to maintain 1NF (no repeating groups in the parent table).

---

### Entity 3: CATEGORY (Strong Entity)
| Attribute | Type | Notes |
|---|---|---|
| **category_id** (PK) | INT | Auto-increment |
| category_name | VARCHAR | Unique |
| description | TEXT | |
| icon_name | VARCHAR | UI icon reference |
| created_at | DATETIME | |

> **3NF Fix:** Workers previously stored `category` as a plain VARCHAR string. Now it is a proper FK to the `categories` table, eliminating the transitive dependency and enabling category-level analytics.

---

### Entity 4: WORKER (Strong Entity — Specialization of USER)
| Attribute | Type | Notes |
|---|---|---|
| **worker_id** (PK) | INT | Auto-increment |
| user_id (FK) | INT | References users.id — 1:1 |
| cnic | VARCHAR | Unique national ID |
| whatsapp | VARCHAR | |
| category_id (FK) | INT | References categories.category_id |
| experience_years | INT | Years of experience |
| bio | TEXT | Worker description |
| approval_status | ENUM | PENDING / APPROVED / REJECTED |
| **rating** | FLOAT | **Derived** — auto-updated by TRIGGER |
| total_jobs | INT | Auto-incremented by TRIGGER on COMPLETED booking |
| created_at | DATETIME | |

> **Derived Attribute:** `rating` is derived from the `ratings` table. A TRIGGER recalculates it automatically after every INSERT/UPDATE on `ratings`.

---

### Entity 5: WORKER_SKILLS (Multi-valued / Composite Attribute Table)
| Attribute | Type | Notes |
|---|---|---|
| **skill_id** (PK) | INT | Auto-increment |
| worker_id (FK) | INT | References workers.worker_id |
| skill_name | VARCHAR | e.g. "Pipe Fitting", "AC Gas Refill" |
| proficiency | ENUM | BEGINNER / INTERMEDIATE / EXPERT |

> **Multi-valued Composite Attribute:** A worker can have multiple skills, each with a proficiency level. Stored separately to maintain 1NF and 2NF.

---

### Entity 6: CUSTOMER (Strong Entity — Specialization of USER)
| Attribute | Type | Notes |
|---|---|---|
| **customer_id** (PK) | INT | Auto-increment |
| user_id (FK) | INT | References users.id — 1:1 |
| loyalty_points | INT | Reward points |
| created_at | DATETIME | |

---

### Entity 7: SERVICE ⚠️ WEAK ENTITY
| Attribute | Type | Notes |
|---|---|---|
| **service_id** (partial key) | INT | Auto-increment within worker scope |
| **worker_id** (FK + part of PK) | INT | Owner — identifying relationship |
| title | VARCHAR | |
| description | TEXT | |
| price | DECIMAL | |
| duration_hrs | DECIMAL | Estimated hours |
| is_active | BOOLEAN | Soft delete |
| created_at | DATETIME | |

> **Weak Entity:** `SERVICE` depends on `WORKER` for its existence and identity.
> - No meaning without a Worker.
> - Primary Key is composite: **(service_id, worker_id)**.
> - The relationship `WORKER —[OFFERS]— SERVICE` is an **Identifying Relationship**.
> - If a Worker is deleted, all their Services are deleted (CASCADE).
> - Drawn with a **DOUBLE RECTANGLE** in Chen notation.
> - The identifying relationship is drawn with a **DOUBLE DIAMOND**.

---

### Entity 8: BOOKING (Associative Entity — resolves M:N between CUSTOMER and WORKER)
| Attribute | Type | Notes |
|---|---|---|
| **booking_id** (PK) | INT | Auto-increment |
| customer_id (FK) | INT | References customers |
| worker_id (FK) | INT | References workers |
| service_id (FK) | INT | Optional — part of composite FK to services |
| service_worker_id (FK) | INT | Paired with service_id for composite FK |
| type | ENUM | NORMAL / ADVANCE / URGENT |
| booking_date | DATETIME | |
| scheduled_time | TIME | |
| status | ENUM | PENDING / ACCEPTED / REJECTED / COMPLETED / CANCELLED |
| notes | TEXT | Optional customer notes |
| total_amount | DECIMAL | Booking value |
| created_at | DATETIME | |
| updated_at | DATETIME | Auto-updated |

---

### Entity 9: RATING (Associative Entity — resolves M:N between CUSTOMER and WORKER)
| Attribute | Type | Notes |
|---|---|---|
| **rating_id** (PK) | INT | Auto-increment |
| customer_id (FK) | INT | References customers |
| worker_id (FK) | INT | References workers |
| booking_id (FK) | INT | Tied to a specific booking |
| stars | TINYINT | 1–5 CHECK constraint |
| review | TEXT | Optional text review |
| created_at | DATETIME | |

---

### Entity 10: MESSAGE
| Attribute | Type | Notes |
|---|---|---|
| **message_id** (PK) | INT | Auto-increment |
| sender_id (FK) | INT | References users.id |
| receiver_id (FK) | INT | References users.id |
| content | TEXT | |
| is_read | BOOLEAN | Default FALSE |
| sent_at | DATETIME | |

---

### Entity 11: NOTIFICATION
| Attribute | Type | Notes |
|---|---|---|
| **notification_id** (PK) | INT | Auto-increment |
| user_id (FK) | INT | References users.id |
| type | VARCHAR | e.g. BOOKING_ACCEPTED |
| message | TEXT | |
| is_read | BOOLEAN | Default FALSE |
| created_at | DATETIME | |

---

### Entity 12: AUDIT_LOG
| Attribute | Type | Notes |
|---|---|---|
| **log_id** (PK) | INT | Auto-increment |
| user_id (FK) | INT | Who triggered the action |
| action | VARCHAR | e.g. STATUS_CHANGE |
| table_name | VARCHAR | Affected table |
| record_id | INT | Affected record |
| old_value | TEXT | Before state |
| new_value | TEXT | After state |
| logged_at | DATETIME | |

---

## 4. Relationships & Cardinality

| Relationship | Entities | Cardinality | Type | Notes |
|---|---|---|---|---|
| IS_A (Worker) | USER → WORKER | 1:1 | Specialization | user_id FK, UNIQUE |
| IS_A (Customer) | USER → CUSTOMER | 1:1 | Specialization | user_id FK, UNIQUE |
| HAS_PHONES | USER → USER_PHONE_NUMBERS | 1:M | Multi-valued attr | user_id FK |
| HAS_SKILLS | WORKER → WORKER_SKILLS | 1:M | Multi-valued attr | worker_id FK |
| BELONGS_TO | WORKER → CATEGORY | M:1 | Regular | category_id FK (3NF fix) |
| OFFERS | WORKER → SERVICE | 1:M | **Identifying** | Weak entity relationship |
| BOOKS | CUSTOMER ↔ WORKER | M:N | Associative | Resolved via BOOKING |
| RATES | CUSTOMER ↔ WORKER | M:N | Associative | Resolved via RATING |
| SENDS | USER ↔ USER | M:N (self) | Self-referencing | Resolved via MESSAGE |
| NOTIFIED | USER → NOTIFICATION | 1:M | Regular | user_id FK |
| REFERENCES | BOOKING → SERVICE | M:1 | Optional | composite FK nullable |
| LINKED_TO | RATING → BOOKING | M:1 | Optional | booking_id nullable FK |
| LOGGED_BY | USER → AUDIT_LOG | 1:M | Regular | user_id FK nullable |

---

## 5. Normalization Analysis (3NF Proof)

### First Normal Form (1NF) ✅
- All attributes are **atomic** (single values per cell).
- Composite `address` is decomposed into `address_street`, `address_city`, `address_zip`.
- Multi-valued `phone_numbers` moved to `user_phone_numbers` table.
- Multi-valued `skills` moved to `worker_skills` table.
- No repeating groups anywhere.

### Second Normal Form (2NF) ✅
- All non-key attributes are **fully functionally dependent** on the entire primary key.
- In `services` (weak entity): `title`, `price`, `description` depend on the full composite PK `(service_id, worker_id)` — not just one part.
- In `worker_skills`: `proficiency` depends on `(worker_id, skill_name)` — the full composite key.
- No partial dependencies exist in any table.

### Third Normal Form (3NF) ✅
- No transitive dependencies.
- Worker's `category_id` is a FK to `categories` — category details (name, description) live in `categories`, not in `workers`. This eliminates the transitive dependency `worker_id → category_name → description`.
- `rating` in `workers` is a derived attribute (computed from `ratings` table via TRIGGER) — not a transitive dependency.
- User details depend directly on `users.id`.
- Rating `stars` depends directly on `rating_id`.

---

## 6. ERD Diagram — draw.io Complete Instructions

### Notation: Chen Notation (standard for DB courses)

```
RECTANGLES          = Strong Entities
DOUBLE RECTANGLE    = Weak Entity (services)
ELLIPSES            = Attributes
DOUBLE ELLIPSE      = Derived Attribute (rating on workers)
UNDERLINED TEXT     = Primary Key attribute
DASHED UNDERLINE    = Partial Key (service_id in services)
DIAMONDS            = Relationships
DOUBLE DIAMOND      = Identifying Relationship (WORKER —[OFFERS]— SERVICE)
LINES               = Connections (1:1, 1:M, M:N labeled)
```

### Step-by-Step draw.io Layout

**Step 1 — Place Strong Entities (rectangles):**
```
Row 1 (top):    [CATEGORY]
Row 2 (middle): [USER]   [WORKER]   [CUSTOMER]
Row 3 (bottom): [BOOKING]  [RATING]  [MESSAGE]
Floating:       [NOTIFICATION]  [AUDIT_LOG]
Weak entity:    [[SERVICE]]  (double rectangle, right of WORKER)
```

**Step 2 — Add Specialization (IS_A) arcs:**
```
USER ——1:1——> [WORKER]   (label: IS_A / user_id FK)
USER ——1:1——> [CUSTOMER] (label: IS_A / user_id FK)
```

**Step 3 — Add Composite Attribute on USER:**
```
Draw ellipse "address" connected to USER
  └── address_street  (ellipse)
  └── address_city    (ellipse)
  └── address_zip     (ellipse)
```

**Step 4 — Add Multi-valued Attribute tables:**
```
USER ——1:M——> [USER_PHONE_NUMBERS]   (double ellipse or separate table rect)
WORKER ——1:M——> [WORKER_SKILLS]      (double ellipse or separate table rect)
```

**Step 5 — Add Weak Entity (SERVICE):**
```
WORKER ——<OFFERS>—— [[SERVICE]]
         (double diamond)
service_id ellipse with DASHED UNDERLINE (partial key)
worker_id is the identifying FK
Arrow: WORKER ——1:M——> SERVICE (with double diamond on relationship)
```

**Step 6 — Add Category relationship:**
```
[CATEGORY] ——1:M——> [WORKER]   (label: BELONGS_TO / category_id FK)
```

**Step 7 — Add M:N Associative Entities:**
```
[CUSTOMER] ——M:N——> [BOOKING] <——M:N—— [WORKER]
[CUSTOMER] ——M:N——> [RATING]  <——M:N—— [WORKER]
[BOOKING]  ——M:1——> [SERVICE]  (optional, dashed line)
[RATING]   ——M:1——> [BOOKING]  (optional, dashed line)
```

**Step 8 — Add Self-referencing MESSAGE:**
```
[USER] ——M:N (self)——> [MESSAGE]
sender_id FK ——> users.id
receiver_id FK ——> users.id
```

**Step 9 — Add 1:M relationships:**
```
[USER] ——1:M——> [NOTIFICATION]
[USER] ——1:M——> [AUDIT_LOG]
```

**Step 10 — Add Derived Attribute on WORKER:**
```
Draw double ellipse "rating" connected to WORKER
(indicates it is derived from the ratings table via TRIGGER)
```

---

## 7. Triggers & Stored Procedures

### Triggers
| Trigger | Event | Action |
|---|---|---|
| `trg_update_worker_rating_after_insert` | AFTER INSERT on ratings | Recalculates worker.rating |
| `trg_update_worker_rating_after_update` | AFTER UPDATE on ratings | Recalculates worker.rating |
| `trg_increment_worker_jobs` | AFTER UPDATE on bookings | Increments worker.total_jobs when status → COMPLETED |
| `trg_audit_booking_status` | AFTER UPDATE on bookings | Logs status changes to audit_log |

### Stored Procedures
| Procedure | Purpose |
|---|---|
| `sp_get_worker_profile(worker_id)` | Returns full worker profile with stats |
| `sp_admin_dashboard()` | Returns platform-wide summary statistics |

### Indexes
| Index | Table | Column(s) | Purpose |
|---|---|---|---|
| idx_workers_category | workers | category_id | Fast category filter |
| idx_workers_status | workers | approval_status | Fast approval filter |
| idx_bookings_customer | bookings | customer_id | Fast customer lookup |
| idx_bookings_worker | bookings | worker_id | Fast worker lookup |
| idx_bookings_status | bookings | status | Fast status filter |
| idx_bookings_date | bookings | booking_date | Fast date range queries |
| idx_ratings_worker | ratings | worker_id | Fast rating aggregation |
| idx_messages_sender | messages | sender_id | Fast message lookup |
| idx_messages_receiver | messages | receiver_id | Fast inbox lookup |
| idx_notifications_user | notifications | user_id, is_read | Fast unread count |

---

## 8. Relational Schema (Final Tables)

```
users              (id PK, name, email, password, phone, dob,
                    address_street, address_city, address_zip,
                    role, is_active, created_at, updated_at)

user_phone_numbers (phone_id PK, user_id FK→users, phone, label)

categories         (category_id PK, category_name UNIQUE, description,
                    icon_name, created_at)

workers            (worker_id PK, user_id FK→users UNIQUE,
                    cnic UNIQUE, whatsapp, category_id FK→categories,
                    experience_years, bio, approval_status,
                    rating [DERIVED], total_jobs, created_at)

worker_skills      (skill_id PK, worker_id FK→workers,
                    skill_name, proficiency)
                    UNIQUE(worker_id, skill_name)

customers          (customer_id PK, user_id FK→users UNIQUE,
                    loyalty_points, created_at)

services           (service_id, worker_id FK→workers,
                    title, description, price, duration_hrs,
                    is_active, created_at)
                    PK(service_id, worker_id)  ← WEAK ENTITY
                    UNIQUE(worker_id, title)

bookings           (booking_id PK, customer_id FK→customers,
                    worker_id FK→workers,
                    service_id + service_worker_id FK→services(composite),
                    type, booking_date, scheduled_time, status,
                    notes, total_amount, created_at, updated_at)

ratings            (rating_id PK, customer_id FK→customers,
                    worker_id FK→workers, booking_id FK→bookings,
                    stars CHECK(1-5), review, created_at)
                    UNIQUE(customer_id, worker_id, booking_id)

messages           (message_id PK, sender_id FK→users,
                    receiver_id FK→users, content, is_read, sent_at)

notifications      (notification_id PK, user_id FK→users,
                    type, message, is_read, created_at)

audit_log          (log_id PK, user_id FK→users,
                    action, table_name, record_id,
                    old_value, new_value, logged_at)
```

---

## 9. Query Coverage Summary

| Query Type | Count | Examples |
|---|---|---|
| Basic SELECT | 5 | Q1–Q5 |
| INNER JOIN | 2 | Q6, Q10 |
| LEFT JOIN | 3 | Q7, Q8, Q13 |
| SELF JOIN | 1 | Q9 |
| AGGREGATE (COUNT, SUM, AVG, MIN, MAX) | 8 | Q11–Q18 |
| Subqueries | 5 | Q19–Q23 |
| CTEs | 3 | Q24–Q26 |
| Window Functions (RANK, DENSE_RANK, ROW_NUMBER, PERCENT_RANK, NTILE, LAG, LEAD, Running Total) | 4 | Q27–Q30 |
| Views | 4 | vw_worker_profiles, vw_booking_summary, vw_admin_stats, vw_unread_messages |
| Stored Procedures | 2 | sp_get_worker_profile, sp_admin_dashboard |
| Triggers | 4 | Rating auto-update, jobs counter, audit log |

---

## 10. Grading Checklist

| Criteria | Status | Evidence |
|---|---|---|
| ERD with proper Chen notation | ✅ | Section 6 — complete draw.io instructions |
| Primary Keys on every entity | ✅ | All 12 tables have PKs |
| Composite Attribute | ✅ | `address` → street + city + zip on `users` |
| Multi-valued Attribute | ✅ | `user_phone_numbers` + `worker_skills` tables |
| Weak Entity | ✅ | `services` depends on `workers` (double rect + double diamond) |
| Derived Attribute | ✅ | `rating` on workers — auto-computed via TRIGGER |
| Cardinality on every relationship | ✅ | 1:1, 1:M, M:N all defined in Section 4 |
| 3NF compliance | ✅ | Full proof in Section 5 |
| Category as proper FK (3NF fix) | ✅ | `category_id` FK replaces plain VARCHAR |
| SELECT queries | ✅ | Q1–Q5 |
| JOIN queries (INNER, LEFT, SELF) | ✅ | Q6–Q10 |
| AGGREGATE queries | ✅ | Q11–Q18 (COUNT, SUM, AVG, MIN, MAX, CASE) |
| Subqueries | ✅ | Q19–Q23 |
| CTEs | ✅ | Q24–Q26 |
| Window Functions | ✅ | Q27–Q30 (RANK, LAG, LEAD, PERCENT_RANK, NTILE) |
| Views | ✅ | 4 views for reporting |
| Triggers | ✅ | 4 triggers (rating, jobs, audit) |
| Stored Procedures | ✅ | 2 procedures |
| Indexes | ✅ | 10 performance indexes |
| Business rules documented | ✅ | Section 2 (14 rules) |
| Relational schema | ✅ | Section 8 |
| draw.io ERD instructions | ✅ | Section 6 (step-by-step) |

