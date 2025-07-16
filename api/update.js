// api/update.js

import { Buffer } from "buffer";

export const config = {
  api: {
    bodyParser: true, // Attivo body parser per ricevere JSON
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST allowed' });
    return;
  }

  // --- 1. Ricevi dati JSON dal frontend ---
  const { giornoMenu, dataReale, excelBase64 } = req.body;
  if (!giornoMenu || !dataReale || !excelBase64) {
    res.status(400).json({ message: "Tutti i campi sono obbligatori (giornoMenu, dataReale, excelBase64)" });
    return;
  }

  // --- 2. Prepara info GitHub ---
  const OWNER = "DevNullCC";
  const REPO = "MensaCC";
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  // --- 3. Aggiorna menu.xlsx ---
  const menuPath = "menu.xlsx";
  const getMenu = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${menuPath}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  let menuSha = null;
  if (getMenu.ok) {
    const menuJson = await getMenu.json();
    menuSha = menuJson.sha;
  }
  const menuBody = {
    message: "Aggiornamento menu.xlsx via backend",
    content: excelBase64,
    ...(menuSha && { sha: menuSha })
  };
  const putMenu = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${menuPath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(menuBody)
  });
  if (!putMenu.ok) {
    res.status(500).json({ message: "Errore salvataggio menu.xlsx" });
    return;
  }

  // --- 4. Aggiorna day_to_start.txt ---
  const txtPath = "day_to_start.txt";
  const getTxt = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${txtPath}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  let txtSha = null;
  if (getTxt.ok) {
    const txtJson = await getTxt.json();
    txtSha = txtJson.sha;
  }
  const txtContent = `${giornoMenu},${dataReale}`;
  const txtBase64 = Buffer.from(txtContent, "utf-8").toString("base64");
  const txtBody = {
    message: "Aggiornamento day_to_start.txt via backend",
    content: txtBase64,
    ...(txtSha && { sha: txtSha })
  };
  const putTxt = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${txtPath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(txtBody)
  });
  if (!putTxt.ok) {
    res.status(500).json({ message: "Errore salvataggio day_to_start.txt" });
    return;
  }

  res.status(200).json({ message: "Tutto aggiornato con successo!" });
}
