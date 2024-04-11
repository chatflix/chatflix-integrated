CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    membership_status text COLLATE pg_catalog."default" NOT NULL DEFAULT 'TRIAL'::text,
    membership_start_date date,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    membership_package text COLLATE pg_catalog."default" DEFAULT '3 Day Trial'::text,
    membership_expiry_date date,
    membership_renewal_date date,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
)

CREATE TABLE IF NOT EXISTS public.affiliate_info
(
    user_id integer NOT NULL,
    referral_code character varying(255) COLLATE pg_catalog."default" NOT NULL,
    total_clicks integer NOT NULL DEFAULT 0,
    total_signups integer NOT NULL DEFAULT 0,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    gross_sales_volume numeric NOT NULL DEFAULT 0.00,
    commission_rate numeric NOT NULL DEFAULT 0.1,
    net_earnings numeric NOT NULL DEFAULT '0'::numeric,
    CONSTRAINT affiliate_info_pkey PRIMARY KEY (user_id),
    CONSTRAINT affiliate_info_affiliate_link_key UNIQUE (referral_code),
    CONSTRAINT affiliate_info_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals
(
    id integer NOT NULL DEFAULT nextval('affiliate_referrals_id_seq'::regclass),
    affiliate_user_id integer NOT NULL,
    referred_user_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT affiliate_referrals_pkey PRIMARY KEY (id),
    CONSTRAINT affiliate_referrals_affiliate_user_id_referred_user_id_key UNIQUE (affiliate_user_id, referred_user_id),
    CONSTRAINT affiliate_referrals_affiliate_user_id_fkey FOREIGN KEY (affiliate_user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT affiliate_referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions
(
    id integer NOT NULL DEFAULT nextval('affiliate_commissions_id_seq'::regclass),
    affiliate_referral_id integer NOT NULL,
    transaction_id bigint NOT NULL,
    transaction_amount numeric(10,2) NOT NULL,
    commission_rate numeric(5,2) NOT NULL DEFAULT 0.1,
    commission_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    transaction_metadata text COLLATE pg_catalog."default",
    CONSTRAINT affiliate_commissions_pkey PRIMARY KEY (id),
    CONSTRAINT affiliate_commissions_affiliate_referral_id_fkey FOREIGN KEY (affiliate_referral_id)
        REFERENCES public.affiliate_referrals (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
