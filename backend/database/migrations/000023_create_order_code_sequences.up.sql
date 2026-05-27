CREATE TABLE order_code_sequences (
    date_key VARCHAR(6) PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0
);
