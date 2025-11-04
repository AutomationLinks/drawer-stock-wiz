-- Extend donations table with comprehensive donor fields
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS formal_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_name TEXT,
ADD COLUMN IF NOT EXISTS is_organization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS work_phone TEXT,
ADD COLUMN IF NOT EXISTS alternate_email TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS comments TEXT,
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS lifetime_contribution_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_non_cash_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_soft_credit_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ytd_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fiscal_ytd_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_year_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_fiscal_year_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_transaction_date DATE,
ADD COLUMN IF NOT EXISTS last_gift_amount NUMERIC,
ADD COLUMN IF NOT EXISTS last_gift_date DATE,
ADD COLUMN IF NOT EXISTS largest_gift_amount NUMERIC,
ADD COLUMN IF NOT EXISTS largest_gift_date DATE,
ADD COLUMN IF NOT EXISTS number_of_gifts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_gift_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pledge_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS join_date DATE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donations_first_name ON donations(first_name);
CREATE INDEX IF NOT EXISTS idx_donations_last_name ON donations(last_name);
CREATE INDEX IF NOT EXISTS idx_donations_city ON donations(city);
CREATE INDEX IF NOT EXISTS idx_donations_state ON donations(state);
CREATE INDEX IF NOT EXISTS idx_donations_is_organization ON donations(is_organization);
CREATE INDEX IF NOT EXISTS idx_donations_alternate_email ON donations(alternate_email);