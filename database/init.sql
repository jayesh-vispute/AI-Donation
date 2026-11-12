CREATE TYPE roleenum AS ENUM ('donor', 'ngo', 'admin');
CREATE TYPE donationstatus AS ENUM ('matched', 'packaging_notified', 'pickup_scheduled', 'collected', 'delivered', 'acknowledged', 'cancelled');
CREATE TYPE demandpriority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE verificationstatus AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE demandstatus AS ENUM ('active', 'partially_fulfilled', 'fulfilled', 'expired', 'cancelled');
CREATE TYPE matchstatus AS ENUM ('active', 'accepted', 'rejected', 'completed');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    role roleenum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ngo_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    organization_name VARCHAR NOT NULL,
    registration_number VARCHAR UNIQUE,
    description TEXT,
    contact_person VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    address VARCHAR,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    latitude FLOAT CHECK (latitude >= -90 AND latitude <= 90),
    longitude FLOAT CHECK (longitude >= -180 AND longitude <= 180),
    verification_status verificationstatus DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES users(id),
    status donationstatus DEFAULT 'matched',
    pickup_address VARCHAR,
    pickup_city VARCHAR,
    pickup_state VARCHAR,
    pickup_postal_code VARCHAR,
    pickup_latitude FLOAT CHECK (pickup_latitude >= -90 AND pickup_latitude <= 90),
    pickup_longitude FLOAT CHECK (pickup_longitude >= -180 AND pickup_longitude <= 180),
    pickup_scheduled_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donation_items (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES donations(id),
    item_name VARCHAR NOT NULL,
    category VARCHAR,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    unit VARCHAR,
    image_url VARCHAR,
    detection_source VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER NOT NULL REFERENCES ngo_profiles(id),
    item_name VARCHAR NOT NULL,
    category VARCHAR,
    quantity_required INTEGER NOT NULL CHECK (quantity_required >= 1),
    quantity_fulfilled INTEGER DEFAULT 0 CHECK (quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity_required),
    priority demandpriority DEFAULT 'medium',
    expiry_date TIMESTAMP,
    description TEXT,
    status demandstatus DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    donation_item_id INTEGER NOT NULL REFERENCES donation_items(id),
    demand_id INTEGER NOT NULL REFERENCES demands(id),
    matched_quantity INTEGER NOT NULL CHECK (matched_quantity >= 1),
    item_similarity_score FLOAT,
    quantity_score FLOAT,
    proximity_score FLOAT,
    priority_score FLOAT,
    overall_score FLOAT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    match_reason TEXT,
    status matchstatus DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_users_firebase_uid ON users(firebase_uid);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_ngo_profiles_city ON ngo_profiles(city);
CREATE INDEX ix_donation_items_item_name ON donation_items(item_name);
CREATE INDEX ix_donation_items_category ON donation_items(category);
CREATE INDEX ix_demands_item_name ON demands(item_name);
CREATE INDEX ix_demands_category ON demands(category);
CREATE INDEX ix_demands_expiry_date ON demands(expiry_date);
