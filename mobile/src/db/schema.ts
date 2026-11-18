export const SCHEMA = `
-- =====================================================================
--  MawJdi / MedTrack : schéma SQLite (base locale du téléphone, mode hors ligne)
--  Contient les données du compte connecté et des patients qu'il accompagne,
--  plus la file de synchronisation OperationSync (uniquement ici).
--  Différences avec PostgreSQL :
--    - identifiants UUID générés par l'appli (valeur par défaut = secours)
--    - énumérations = TEXT + CHECK
--    - booléens = INTEGER 0/1
--    - dates et heures = TEXT (ISO 8601 : 'YYYY-MM-DD', 'HH:MM', 'YYYY-MM-DDTHH:MM:SSZ')
--    - pas de mot de passe sur le téléphone
-- =====================================================================

PRAGMA foreign_keys = ON;   -- à exécuter à CHAQUE ouverture de connexion

-- ---------------------------------------------------------------------
--  1. Comptes et patients
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nom_util    TEXT NOT NULL UNIQUE,
    prenom      TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE
);

CREATE TABLE parametre_notif (
    utilisateur_id    TEXT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    rappels_prise     INTEGER NOT NULL DEFAULT 1 CHECK (rappels_prise IN (0,1)),
    son_vibration     INTEGER NOT NULL DEFAULT 1 CHECK (son_vibration IN (0,1)),
    resume_quotidien  INTEGER NOT NULL DEFAULT 0 CHECK (resume_quotidien IN (0,1)),
    delai_relance_min INTEGER NOT NULL DEFAULT 10 CHECK (delai_relance_min > 0),
    nombre_rappels    INTEGER NOT NULL DEFAULT 3  CHECK (nombre_rappels >= 0),
    seuil_oublis      INTEGER CHECK (seuil_oublis > 0),        -- NULL = pas d'alerte aux proches
    partage_proches   INTEGER NOT NULL DEFAULT 0 CHECK (partage_proches IN (0,1))
);

CREATE TABLE patient (
    id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    utilisateur_id      TEXT UNIQUE REFERENCES utilisateur(id) ON DELETE CASCADE,  -- NULL = patient sans compte
    nom                 TEXT NOT NULL,
    prenom              TEXT NOT NULL,
    date_naissance      TEXT,
    maladies_chroniques TEXT,
    allergies           TEXT,
    telephone           TEXT,
    adresse             TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE habitudes_repas (
    patient_id     TEXT PRIMARY KEY REFERENCES patient(id) ON DELETE CASCADE,
    reveil         TEXT,
    petit_dejeuner TEXT,
    dejeuner       TEXT,
    diner          TEXT,
    coucher        TEXT
);

CREATE TABLE accompagnement (
    utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    patient_id     TEXT NOT NULL REFERENCES patient(id)     ON DELETE CASCADE,
    lien           TEXT NOT NULL CHECK (lien IN ('PARENT','CONJOINT','ENFANT','AMI','AUTRE')),
    PRIMARY KEY (utilisateur_id, patient_id)
);

CREATE TABLE proche_notifie (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    prenom     TEXT NOT NULL,
    contact    TEXT NOT NULL,
    canal      TEXT NOT NULL CHECK (canal IN ('EMAIL','WHATSAPP')),
    relation   TEXT
);

-- ---------------------------------------------------------------------
--  2. Médecins, rendez-vous, notes
-- ---------------------------------------------------------------------
CREATE TABLE medecin (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nom        TEXT NOT NULL,
    specialite TEXT,
    telephone  TEXT,
    adresse    TEXT
);

CREATE TABLE rendez_vous (
    id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id   TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    medecin_id   TEXT REFERENCES medecin(id) ON DELETE SET NULL,
    date_rdv     TEXT NOT NULL,
    lieu         TEXT,
    notes        TEXT,
    rappel_actif INTEGER NOT NULL DEFAULT 1 CHECK (rappel_actif IN (0,1))
);

CREATE TABLE note (
    id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id     TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    rendez_vous_id TEXT REFERENCES rendez_vous(id) ON DELETE SET NULL,
    type           TEXT NOT NULL CHECK (type IN ('QUESTION','MEMO')),
    contenu        TEXT NOT NULL,
    date_creation  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ---------------------------------------------------------------------
--  3. Ordonnances, médicaments (copie en lecture seule du serveur), traitements
-- ---------------------------------------------------------------------
CREATE TABLE ordonnance (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id      TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    date_emission   TEXT,
    photo_url       TEXT,
    date_expiration TEXT,
    CHECK (date_expiration IS NULL OR date_emission IS NULL OR date_expiration >= date_emission)
);

CREATE TABLE medicament (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nom_commercial  TEXT NOT NULL,
    dci             TEXT,
    dosage          TEXT,
    forme           TEXT,
    saisie_manuelle INTEGER NOT NULL DEFAULT 0 CHECK (saisie_manuelle IN (0,1))
);

CREATE TABLE interaction (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    medicament_a_id TEXT NOT NULL REFERENCES medicament(id) ON DELETE CASCADE,
    medicament_b_id TEXT NOT NULL REFERENCES medicament(id) ON DELETE CASCADE,
    niveau          TEXT NOT NULL CHECK (niveau IN ('FAIBLE','MODERE','ELEVE')),
    description     TEXT,
    CHECK (medicament_a_id < medicament_b_id),
    UNIQUE (medicament_a_id, medicament_b_id)
);

CREATE TABLE traitement (
    id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id         TEXT NOT NULL REFERENCES patient(id)     ON DELETE CASCADE,
    ordonnance_id      TEXT REFERENCES ordonnance(id)           ON DELETE SET NULL,
    medicament_id      TEXT NOT NULL REFERENCES medicament(id)  ON DELETE RESTRICT,
    source             TEXT NOT NULL DEFAULT 'MANUEL' CHECK (source IN ('ORDONNANCE','MANUEL')),
    dosage             TEXT,
    frequence          TEXT,
    duree_jours        INTEGER CHECK (duree_jours > 0),
    date_debut         TEXT NOT NULL,
    instruction        TEXT,
    quantite_par_prise INTEGER NOT NULL DEFAULT 1 CHECK (quantite_par_prise > 0),
    stock_restant      INTEGER CHECK (stock_restant >= 0),
    seuil_stock_faible INTEGER NOT NULL DEFAULT 5 CHECK (seuil_stock_faible >= 0)
);

-- ---------------------------------------------------------------------
--  4. Rappels, prises, notifications
-- ---------------------------------------------------------------------
CREATE TABLE rappel (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    traitement_id TEXT NOT NULL REFERENCES traitement(id) ON DELETE CASCADE,
    moment        TEXT NOT NULL CHECK (moment IN ('REVEIL','PETIT_DEJ','DEJEUNER','DINER','COUCHER','PERSO')),
    heure         TEXT NOT NULL,
    type          TEXT NOT NULL DEFAULT 'NOTIFICATION' CHECK (type IN ('NOTIFICATION','ALARME','VIBRATION')),
    actif         INTEGER NOT NULL DEFAULT 1 CHECK (actif IN (0,1))
);

CREATE TABLE prise (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    traitement_id     TEXT NOT NULL REFERENCES traitement(id) ON DELETE CASCADE,
    date_prevue       TEXT NOT NULL,
    date_confirmation TEXT,
    reporte_jusqua    TEXT,
    statut            TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE','PRIS','OUBLIE','REPORTE')),
    UNIQUE (traitement_id, date_prevue),
    CHECK (statut <> 'PRIS'    OR date_confirmation IS NOT NULL),
    CHECK (statut <> 'REPORTE' OR reporte_jusqua    IS NOT NULL)
);

CREATE TABLE notification (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id  TEXT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    prise_id    TEXT REFERENCES prise(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK (type IN ('RAPPEL','OUBLI','STOCK_FAIBLE','INTERACTION')),
    message     TEXT NOT NULL,
    date_envoi  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    statut      TEXT NOT NULL DEFAULT 'ENVOYEE'
);

-- ---------------------------------------------------------------------
--  5. File de synchronisation (uniquement dans SQLite)
-- ---------------------------------------------------------------------
CREATE TABLE operation_sync (
    id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    entite         TEXT NOT NULL,                        -- nom de la table modifiée (ex. 'prise')
    entite_id      TEXT NOT NULL,                        -- id de la ligne modifiée
    operation      TEXT NOT NULL CHECK (operation IN ('CREATE','UPDATE','DELETE')),
    etat           TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (etat IN ('EN_ATTENTE','ENVOYE','ERREUR')),
    horodatage     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ---------------------------------------------------------------------
--  6. Index
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
CREATE INDEX idx_opsync_etat            ON operation_sync(etat, horodatage);
`;