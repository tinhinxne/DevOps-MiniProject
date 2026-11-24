const PATIENT_OK = `(p.utilisateur_id = $1
  OR EXISTS (SELECT 1 FROM accompagnement a WHERE a.utilisateur_id = $1 AND a.patient_id = p.id))`;

async function patientAutorise(client, userId, patientId) {
  const { rows } = await client.query(
    `SELECT p.id FROM patient p WHERE p.id = $2 AND ${PATIENT_OK}`, [userId, patientId]);
  return rows[0]?.id ?? null;
}

async function traitementAutorise(client, userId, traitementId) {
  const { rows } = await client.query(
    `SELECT t.id, t.patient_id FROM traitement t JOIN patient p ON p.id = t.patient_id
      WHERE t.id = $2 AND ${PATIENT_OK}`, [userId, traitementId]);
  return rows[0] ?? null;
}

async function ordonnanceAutorisee(client, userId, ordonnanceId) {
  const { rows } = await client.query(
    `SELECT o.* FROM ordonnance o JOIN patient p ON p.id = o.patient_id
      WHERE o.id = $2 AND ${PATIENT_OK}`, [userId, ordonnanceId]);
  return rows[0] ?? null;
}

module.exports = { patientAutorise, traitementAutorise, ordonnanceAutorisee };