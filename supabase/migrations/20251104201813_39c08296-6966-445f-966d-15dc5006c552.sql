-- Add status and is_out_of_state columns to partners table
ALTER TABLE partners
ADD COLUMN status TEXT DEFAULT 'Active',
ADD COLUMN is_out_of_state BOOLEAN DEFAULT false;

-- Create indexes for filtering by status and out-of-state
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_out_of_state ON partners(is_out_of_state);