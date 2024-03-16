CREATE TABLE membership_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  issued TIMESTAMP NOT NULL,
  expiry TIMESTAMP NOT NULL,
  has_been_used BOOLEAN DEFAULT FALSE,
  is_free_trial BOOLEAN DEFAULT FALSE,
  transaction_id VARCHAR(255),
  notes TEXT
);

CREATE TABLE transactions (
	id SERIAL PRIMARY KEY,
	product_id int not null,
	transaction_date timestamp default NOW(),
	amount_usd decimal not null,
	payment_provider varchar(255),
	payment_id varchar(255),
	is_crypto boolean default false,
	is_free boolean default false,
	notes TEXT
);

CREATE TABLE products (
	id serial primary key,
	product_name varchar(255),
	description varchar(255),
	price decimal,
	membership_duration int,
	max_activations int
);