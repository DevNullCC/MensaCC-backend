// api/update.js

export default async function handler(req, res) {
    // --- INIZIO: CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- FINE: CORS ---
  
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST allowed' });
    return;
  }

  const { message } = req.body;

  if (!message) {
    res.status(400).json({ message: 'Message required' });
    return;
  }

  // Variabili principali
  const OWNER = 'DevNullCC';
  const REPO = 'MensaCC';
  const PATH = 'Mess.txt';

  // Token come secret ENV (mai metterlo nel codice!)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  // 1. Recupera SHA attuale del file (obbligatorio per update)
  const fileResp = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );

  if (!fileResp.ok) {
    const err = await fileResp.text();
    res.status(fileResp.status).json({ message: 'Errore GET file', err });
    return;
  }

  const fileData = await fileResp.json();

  // 2. Codifica il nuovo messaggio in base64
  const base64content = Buffer.from(message, 'utf-8').toString('base64');

  // 3. Aggiorna il file su GitHub
  const updateResp = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Aggiornamento via API MensaCC-backend',
        content: base64content,
        sha: fileData.sha
      })
    }
  );

  if (!updateResp.ok) {
    const err = await updateResp.text();
    res.status(updateResp.status).json({ message: 'Errore PUT file', err });
    return;
  }

  const updateData = await updateResp.json();
  res.status(200).json({ message: 'File aggiornato con successo!', updateData });
}
