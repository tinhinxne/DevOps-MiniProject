const LIENS = ['PARENT', 'CONJOINT', 'ENFANT', 'AMI', 'AUTRE'];

// Retourne un message d'erreur, ou null si tout est valide
function validatePatients(list) {
  if (!Array.isArray(list) || list.length === 0) return 'Au moins un patient suivi est requis';
  for (const p of list) {
    if (!p || typeof p.nom !== 'string' || typeof p.prenom !== 'string'
        || !p.nom.trim() || !p.prenom.trim()) {
      return 'nom et prenom requis pour chaque patient';
    }
    if (p.nom.trim().length > 100 || p.prenom.trim().length > 100) {
      return 'nom/prénom : 100 caractères maximum';
    }
    if (!LIENS.includes(p.lien)) return 'Lien invalide (PARENT, CONJOINT, ENFANT, AMI, AUTRE)';
  }
  return null;
}

// À appeler dans une transaction
async function addPatientsSuivis(client, aidantId, list) {
  const created = [];
  for (const p of list) {
    const { rows } = await client.query(
      'INSERT INTO patient (nom, prenom) VALUES ($1, $2) RETURNING id, nom, prenom',
      [p.nom.trim(), p.prenom.trim()]
    );
    await client.query('INSERT INTO habitudes_repas (patient_id) VALUES ($1)', [rows[0].id]);
    await client.query(
      'INSERT INTO accompagnement (utilisateur_id, patient_id, lien) VALUES ($1, $2, $3)',
      [aidantId, rows[0].id, p.lien]
    );
    created.push({ ...rows[0], lien: p.lien });
  }
  return created;
}

async function listPatientsSuivis(db, aidantId) {
  const { rows } = await db.query(
    `SELECT p.id, p.nom, p.prenom, a.lien
       FROM accompagnement a
       JOIN patient p ON p.id = a.patient_id
      WHERE a.utilisateur_id = $1
      ORDER BY p.prenom, p.nom`,
    [aidantId]
  );
  return rows;
}

module.exports = { LIENS, validatePatients, addPatientsSuivis, listPatientsSuivis };
