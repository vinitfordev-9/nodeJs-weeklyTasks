-- ================================================
-- Task 3 - MySQL
-- Same Schema & Queries as PostgreSQL
-- ================================================

-- ================================================
-- Query 1
-- Users and their Orders (JOIN)
-- ================================================

SELECT
    u.user_id,
    u.name,
    o.order_id,
    o.order_date,
    o.status
FROM users u
JOIN orders o
ON u.user_id = o.user_id;

-- ================================================
-- Query 2
-- Users, Orders, Products and Quantity
-- (4 Table JOIN)
-- ================================================

SELECT
    u.name,
    o.order_id,
    p.product_name,
    oi.quantity
FROM users u
JOIN orders o
ON u.user_id = o.user_id
JOIN order_items oi
ON o.order_id = oi.order_id
JOIN products p
ON oi.product_id = p.product_id;

-- ================================================
-- Query 3
-- Order Details
-- ================================================

SELECT
    o.order_id,
    p.product_name,
    oi.quantity,
    oi.price
FROM orders o
JOIN order_items oi
ON o.order_id = oi.order_id
JOIN products p
ON oi.product_id = p.product_id;

-- ================================================
-- Query 4
-- GROUP BY + HAVING
-- ================================================

SELECT
    product_id,
    SUM(quantity) AS total_quantity
FROM order_items
GROUP BY product_id
HAVING SUM(quantity) >= 2;

-- ================================================
-- Query 5
-- Subquery
-- ================================================

SELECT
    product_name,
    price
FROM products
WHERE price >
(
    SELECT AVG(price)
    FROM products
);

-- ================================================
-- Query 6
-- Window Function
-- ================================================

SELECT
    product_name,
    price,
    RANK() OVER(ORDER BY price DESC) AS price_rank
FROM products;

-- ================================================
-- Query 7
-- Aggregate Function
-- ================================================

SELECT
    p.product_name,
    SUM(oi.quantity) AS total_sold
FROM products p
JOIN order_items oi
ON p.product_id = oi.product_id
GROUP BY p.product_name;

-- ================================================
-- Query 8
-- LEFT JOIN
-- ================================================

SELECT
    u.name,
    o.order_id
FROM users u
LEFT JOIN orders o
ON u.user_id = o.user_id;

-- ================================================
-- Query 9
-- Transaction
-- ================================================

START TRANSACTION;

UPDATE products
SET stock_quantity = stock_quantity - 1
WHERE product_id = 1;

COMMIT;

-- ================================================
-- Query 10
-- Top 3 Orders
-- ================================================

SELECT
    order_id,
    total_amount
FROM orders
ORDER BY total_amount DESC
LIMIT 3;