CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL,
    total NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product TEXT,
    quantity INT,
    unit_price NUMERIC
);

CREATE INDEX idx_orders_status_created_at
ON orders(status, created_at);
