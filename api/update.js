// api/update.js

import formidable from "formidable";
import fs from "fs";
import { Buffer } from "buffer";

// Disabilita il body parser di Vercel per usare formidable
export const config = {
  api: {
    bodyParser: false,
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

  // Usa formidable per gestire FormData con file
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ message: "Errore nel parsing del form", err });
      return;
    }

    const giornoMenu = fields.giornoMenu;
    const dataReale = fields.dataReale;
    const excelFile = files.excel;

    if (!giornoMenu || !dataReale || !excelFile) {
      res.status(400).json({ message: "Tutti i campi sono obbligatori" });
      return;
    }

    // Leggi il file Excel come buffer
    const excelBuffer = fs.readFileSync(excelFile.filepath);
    const excelBase64 = excelBuffer.toString("base64");

    // Prepara info per GitHub
    const OWNER = "DevNullCC";
    const REPO = "MensaCC";
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // 1. Aggiorna/salva menu.xlsx
    const menuPath = "menu.xlsx";
    // Recupera SHA (serve per update via API)
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

    // 2. Aggiorna day_to_start.txt
    const txtPath = "day_to_start.txt";
    // Recupera SHA
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
  });
}
