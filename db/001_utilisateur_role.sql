-- db/migrations/001_utilisateur_role.sql
-- Migration IDEMPOTENTE : peut être rejouée sans erreur sur une base existante.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_utilisateur') THEN
        CREATE TYPE role_utilisateur AS ENUM ('PATIENT', 'AIDANT');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS utilisateur_role (
    utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role           role_utilisateur NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (utilisateur_id, role)
);

-- Rattrapage des comptes déjà existants
INSERT INTO utilisateur_role (utilisateur_id, role)
SELECT utilisateur_id, 'PATIENT' FROM patient WHERE utilisateur_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO utilisateur_role (utilisateur_id, role)
SELECT DISTINCT utilisateur_id, 'AIDANT' FROM accompagnement
ON CONFLICT DO NOTHING;