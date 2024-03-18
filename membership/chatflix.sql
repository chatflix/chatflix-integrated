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


INSERT INTO products (product_name, description, price, membership_duration, max_activations) VALUES
('24 Hour Free Trial', 'Dive into a cinematic universe with our 24-hour free trial. Stream from over 450,000 movies and TV episodes on 1 device. It’s a window to all that’s trending and timeless—absolutely free!', 0.00, 1, 1),
('7 Days', 'Enjoy a week-long journey through a wealth of content. Access every major streaming hit, iTunes exclusive, and theater marvel on 2 of your devices. It’s a ticket to endless entertainment.', 4.95, 7, 2),
('30 Days', 'Embrace a month of unlimited streaming. From classic TV shows to blockbuster movies, get it all on 3 devices. Perfect for the enthusiast ready to explore without limits.', 9.95, 30, 3),
('180 Days', 'Settle in for six months of non-stop streaming. This plan is ideal for the avid watcher looking to indulge in every storyline, on up to 4 devices, at a great value.', 37.95, 180, 4),
('365 Days', 'Our ultimate plan for the ultimate viewer. Enjoy a full year of unlimited streaming. Expand your horizons with every title under the stars, available on up to 8 devices.', 49.95, 365, 8);
