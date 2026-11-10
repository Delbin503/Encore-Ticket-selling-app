CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, fullname VARCHAR(100) NOT NULL, email VARCHAR(190) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
 role ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer', status ENUM('active','banned') NOT NULL DEFAULT 'active',
 seller_application ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none', application_note VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS events (
 id INT AUTO_INCREMENT PRIMARY KEY, artist VARCHAR(100) NOT NULL, title VARCHAR(160) NOT NULL, genre VARCHAR(30) NOT NULL, venue VARCHAR(150) NOT NULL,
 city VARCHAR(50) NOT NULL, event_date DATETIME NOT NULL, image VARCHAR(120) NOT NULL, color VARCHAR(20) NOT NULL, price_cap DECIMAL(10,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
 id INT AUTO_INCREMENT PRIMARY KEY, event_id INT NOT NULL, seller_id INT NOT NULL, section VARCHAR(80) NOT NULL, seat VARCHAR(60) NOT NULL,
 price DECIMAL(10,2) NOT NULL, status ENUM('available','sold','cancelled','removed') NOT NULL DEFAULT 'available', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(event_id) REFERENCES events(id), FOREIGN KEY(seller_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS orders (
 id INT AUTO_INCREMENT PRIMARY KEY, listing_id INT NOT NULL UNIQUE, buyer_id INT NOT NULL, price DECIMAL(10,2) NOT NULL,
 payment_mode VARCHAR(20) NOT NULL DEFAULT 'simulation', handover_details TEXT, handover_status ENUM('pending','sent','received') NOT NULL DEFAULT 'pending',
 payout_status ENUM('pending','simulated') NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(listing_id) REFERENCES listings(id), FOREIGN KEY(buyer_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS reports (
 id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL UNIQUE, buyer_id INT NOT NULL, reason TEXT NOT NULL,
 status ENUM('open','confirmed','dismissed') NOT NULL DEFAULT 'open', decision VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id), FOREIGN KEY(buyer_id) REFERENCES users(id)
);
