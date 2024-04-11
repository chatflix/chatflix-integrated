-- Users and affiliate commission tracking. 

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    has_active_subscription BOOLEAN NOT NULL DEFAULT false,
    subscription_end_date DATE,
    next_bill_date DATE ,
    has_recurring_billing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    activation_code varchar(255) --the code for their currently active membership. in recurring billing, this updates every month
);

-- Affiliate Info Table
CREATE TABLE affiliate_info (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    affiliate_link VARCHAR(255) UNIQUE NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    signups INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Affiliate Referrals Table
CREATE TABLE affiliate_referrals (
    id SERIAL PRIMARY KEY,
    affiliate_user_id INTEGER NOT NULL REFERENCES users(id),
    referred_user_id INTEGER NOT NULL REFERENCES users(id),
    signup_date TIMESTAMP NOT NULL DEFAULT NOW(),
    lifetime_customer_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_affiliate_commission NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_in_good_standing BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (affiliate_user_id, referred_user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Affiliate Commissions Table
CREATE TABLE affiliate_commissions (
    id SERIAL PRIMARY KEY,
    affiliate_referral_id INTEGER NOT NULL REFERENCES affiliate_referrals(id),
    affiliate_user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_id VARCHAR(255) NOT NULL,
    payment_amount NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) NOT NULL,
    commission_amount NUMERIC(10, 2) NOT NULL,
    is_recurring_payment BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
