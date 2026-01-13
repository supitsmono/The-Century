-- Capsules table
CREATE TABLE IF NOT EXISTS capsules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  country VARCHAR(100) NOT NULL,
  town VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  message TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  video TEXT,
  age_at_creation INTEGER NOT NULL,
  archival_year INTEGER NOT NULL,
  archival_month VARCHAR(50) NOT NULL,
  archival_day INTEGER NOT NULL,
  archival_time VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  email VARCHAR(255)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at);
CREATE INDEX IF NOT EXISTS idx_capsules_payment_status ON capsules(payment_status);
CREATE INDEX IF NOT EXISTS idx_capsules_payment_id ON capsules(payment_id);
