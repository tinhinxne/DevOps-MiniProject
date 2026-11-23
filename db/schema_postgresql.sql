-- =====================================================================
--  MawJdi / MedTrack : schéma PostgreSQL (base serveur, source de vérité)
--  Compatible PostgreSQL 13+ et Supabase (gen_random_uuid() intégré)
--  Note : la table OperationSync n'existe PAS ici, elle vit seulement
--  dans la base SQLite du téléphone (voir schema_sqlite.sql).
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. Énumérations
-- ---------------------------------------------------------------------
CREATE TYPE type_rappel          AS ENUM ('NOTIFICATION', 'ALARME', 'VIBRATION');
CREATE TYPE moment_prise         AS ENUM ('REVEIL', 'PETIT_DEJ', 'DEJEUNER', 'DINER', 'COUCHER', 'PERSO');
CREATE TYPE statut_prise         AS ENUM ('EN_ATTENTE', 'PRIS', 'OUBLIE', 'REPORTE');
CREATE TYPE type_notification    AS ENUM ('RAPPEL', 'OUBLI', 'STOCK_FAIBLE', 'INTERACTION');
CREATE TYPE niveau_interaction   AS ENUM ('FAIBLE', 'MODERE', 'ELEVE');
CREATE TYPE canal_envoi          AS ENUM ('EMAIL', 'WHATSAPP');
CREATE TYPE source_traitement    AS ENUM ('ORDONNANCE', 'MANUEL');
CREATE TYPE type_note            AS ENUM ('QUESTION', 'MEMO');
CREATE TYPE lien_accompagnement  AS ENUM ('PARENT', 'CONJOINT', 'ENFANT', 'AMI', 'AUTRE');

-- ---------------------------------------------------------------------
--  2. Comptes et patients
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_util    VARCHAR(50)  NOT NULL UNIQUE,          -- pseudo de connexion
    prenom      VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    mdp_hash    TEXT         NOT NULL,                 -- jamais le mot de passe en clair (bcrypt/argon2)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Utilisateur 1 ◆ 1 ParametreNotif
CREATE TABLE parametre_notif (
    utilisateur_id    UUID PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    rappels_prise     BOOLEAN NOT NULL DEFAULT TRUE,
    son_vibration     BOOLEAN NOT NULL DEFAULT TRUE,
    resume_quotidien  BOOLEAN NOT NULL DEFAULT FALSE,
    delai_relance_min INT     NOT NULL DEFAULT 10 CHECK (delai_relance_min > 0),
    nombre_rappels    INT     NOT NULL DEFAULT 3  CHECK (nombre_rappels >= 0),
    seuil_oublis      INT              CHECK (seuil_oublis > 0),   -- NULL = pas d'alerte aux proches
    partage_proches   BOOLEAN NOT NULL DEFAULT FALSE
);
-- Section 1 (énumérations)
CREATE TYPE role_utilisateur AS ENUM ('PATIENT', 'AIDANT');

-- Section 2, juste après CREATE TABLE utilisateur (...)
CREATE TABLE utilisateur_role (
    utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role           role_utilisateur NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (utilisateur_id, role)
);
-- Utilisateur 0..1 — 0..1 Patient : utilisateur_id est NULL pour un patient créé par un aidant
CREATE TABLE patient (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id      UUID UNIQUE REFERENCES utilisateur(id) ON DELETE CASCADE,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    date_naissance      DATE,
    maladies_chroniques TEXT,
    allergies           TEXT,
    telephone           VARCHAR(30),
    adresse             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient 1 — 1 HabitudesRepas
CREATE TABLE habitudes_repas (
    patient_id     UUID PRIMARY KEY REFERENCES patient(id) ON DELETE CASCADE,
    reveil         TIME,
    petit_dejeuner TIME,
    dejeuner       TIME,
    diner          TIME,
    coucher        TIME
);

-- Classe d'association « aide » : un aidant (Utilisateur) accompagne un Patient
-- (pas de ligne ici pour son propre profil : celui-là passe par patient.utilisateur_id)
CREATE TABLE accompagnement (
    utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    patient_id     UUID NOT NULL REFERENCES patient(id)     ON DELETE CASCADE,
    lien           lien_accompagnement NOT NULL,
    PRIMARY KEY (utilisateur_id, patient_id)
);

-- Proche sans compte, prévenu par message quand seuil_oublis est atteint
CREATE TABLE proche_notifie (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    prenom     VARCHAR(100) NOT NULL,
    contact    VARCHAR(255) NOT NULL,
    canal      canal_envoi  NOT NULL,
    relation   VARCHAR(50),
    statut     statut_invitation NOT NULL DEFAULT 'EN_ATTENTE',
    token      UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    repondu_le TIMESTAMPTZ
);
-- ---------------------------------------------------------------------
--  3. Médecins, rendez-vous, notes
-- ---------------------------------------------------------------------
-- Choix : chaque patient a sa propre liste de médecins (Patient 1 — 0..* Medecin)
CREATE TABLE medecin (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nom        VARCHAR(100) NOT NULL,
    specialite VARCHAR(100),
    telephone  VARCHAR(30),
    adresse    TEXT
);

CREATE TABLE rendez_vous (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    medecin_id  UUID REFERENCES medecin(id) ON DELETE SET NULL,   -- 0..1
    date_rdv    TIMESTAMPTZ NOT NULL,
    lieu        VARCHAR(255),
    notes       TEXT,
    rappel_actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE note (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    rendez_vous_id UUID REFERENCES rendez_vous(id) ON DELETE SET NULL,  -- 0..1
    type           type_note NOT NULL,
    contenu        TEXT NOT NULL,
    date_creation  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
--  4. Ordonnances, médicaments, traitements
-- ---------------------------------------------------------------------
-- Patient 1 ◆ 0..* ordonnance
CREATE TABLE ordonnance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    date_emission   DATE,
    photo_url       TEXT,
    date_expiration DATE,
    CHECK (date_expiration IS NULL OR date_emission IS NULL OR date_expiration >= date_emission)
);

-- Référentiel de médicaments (API ou saisie manuelle)
CREATE TABLE medicament (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_commercial   VARCHAR(150) NOT NULL,
    dci              VARCHAR(150),
    dosage           VARCHAR(50),
    forme            VARCHAR(50),
    saisie_manuelle  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Interaction médicamenteuse : deux liens vers Medicament (A et B)
CREATE TABLE interaction (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicament_a_id UUID NOT NULL REFERENCES medicament(id) ON DELETE CASCADE,
    medicament_b_id UUID NOT NULL REFERENCES medicament(id) ON DELETE CASCADE,
    niveau         niveau_interaction NOT NULL,
    description    TEXT,
    CHECK (medicament_a_id < medicament_b_id),       -- l'appli range toujours la paire dans le même ordre
    UNIQUE (medicament_a_id, medicament_b_id)
);

-- 1 Traitement = 1 médicament pris par 1 patient, avec son horaire
CREATE TABLE traitement (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id         UUID NOT NULL REFERENCES patient(id)     ON DELETE CASCADE,
    ordonnance_id      UUID REFERENCES ordonnance(id)           ON DELETE SET NULL,  -- NULL = ajout direct
    medicament_id      UUID NOT NULL REFERENCES medicament(id)  ON DELETE RESTRICT,
    source             source_traitement NOT NULL DEFAULT 'MANUEL',
    dosage             VARCHAR(50),
    frequence          VARCHAR(50),
    duree_jours        INT CHECK (duree_jours > 0),
    date_debut         DATE NOT NULL,
    instruction        TEXT,
    quantite_par_prise INT NOT NULL DEFAULT 1 CHECK (quantite_par_prise > 0),
    stock_restant      INT CHECK (stock_restant >= 0),
    seuil_stock_faible INT NOT NULL DEFAULT 5 CHECK (seuil_stock_faible >= 0)
);

-- ---------------------------------------------------------------------
--  5. Rappels, prises, notifications
-- ---------------------------------------------------------------------
CREATE TABLE rappel (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traitement_id UUID NOT NULL REFERENCES traitement(id) ON DELETE CASCADE,
    moment        moment_prise NOT NULL,
    heure         TIME NOT NULL,                       -- heure choisie (PERSO) ou déduite des habitudes
    type          type_rappel NOT NULL DEFAULT 'NOTIFICATION',
    actif         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE prise (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traitement_id     UUID NOT NULL REFERENCES traitement(id) ON DELETE CASCADE,
    date_prevue       TIMESTAMPTZ NOT NULL,
    date_confirmation TIMESTAMPTZ,
    reporte_jusqua    TIMESTAMPTZ,
    statut            statut_prise NOT NULL DEFAULT 'EN_ATTENTE',
    UNIQUE (traitement_id, date_prevue),
    CHECK (statut <> 'PRIS'    OR date_confirmation IS NOT NULL),
    CHECK (statut <> 'REPORTE' OR reporte_jusqua    IS NOT NULL)
);

CREATE TABLE notification (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    prise_id    UUID REFERENCES prise(id) ON DELETE SET NULL,      -- 0..1
    type        type_notification NOT NULL,
    message     TEXT NOT NULL,
    date_envoi  TIMESTAMPTZ NOT NULL DEFAULT now(),
    statut      VARCHAR(20) NOT NULL DEFAULT 'ENVOYEE'             -- à préciser (ex. ENVOYEE / LUE)
);

-- ---------------------------------------------------------------------
--  6. Index sur les clés étrangères les plus utilisées
-- ---------------------------------------------------------------------
CREATE INDEX idx_accompagnement_patient ON accompagnement(patient_id);
CREATE INDEX idx_proche_patient         ON proche_notifie(patient_id);
CREATE INDEX idx_medecin_patient        ON medecin(patient_id);
CREATE INDEX idx_rdv_patient_date       ON rendez_vous(patient_id, date_rdv);
CREATE INDEX idx_note_patient           ON note(patient_id);
CREATE INDEX idx_ordonnance_patient     ON ordonnance(patient_id);
CREATE INDEX idx_traitement_patient     ON traitement(patient_id);
CREATE INDEX idx_traitement_ordonnance  ON traitement(ordonnance_id);
CREATE INDEX idx_rappel_traitement      ON rappel(traitement_id);
CREATE INDEX idx_prise_traitement_date  ON prise(traitement_id, date_prevue);
CREATE INDEX idx_prise_statut           ON prise(statut);
CREATE INDEX idx_notification_patient   ON notification(patient_id, date_envoi);