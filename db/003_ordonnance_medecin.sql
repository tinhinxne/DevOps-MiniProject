ALTER TABLE ordonnance
  ADD COLUMN IF NOT EXISTS medecin_id UUID REFERENCES medecin(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ordonnance_medecin ON ordonnance(medecin_id);