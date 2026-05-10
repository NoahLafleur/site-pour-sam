require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const xss = require('xss');

const app = express();

// â”€â”€ Securite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: ['https://noahlafleur.github.io', 'http://localhost'] }));

// Rate limiting: max 10 requetes par 15 minutes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de requetes. Reessayez dans 15 minutes.' }
});
app.use('/api/', limiter);

// â”€â”€ Nodemailer (Gmail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// â”€â”€ Sanitisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function clean(str) {
  return xss(String(str || '').trim());
}

// â”€â”€ Route: Envoyer une facture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/facture', async (req, res) => {
  const { client_nom, client_email, client_adresse, facture_numero,
          description, montant, date_facture, date_echeance, note } = req.body;

  if (!client_nom || !client_email || !description || !montant) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(client_email)) {
    return res.status(400).json({ error: 'Courriel invalide.' });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:12px;overflow:hidden;">
      <div style="background:#1a3a5c;padding:24px;text-align:center;">
        <h1 style="color:#4fc3f7;margin:0;font-size:1.4rem;">ENTRETIEN S.O</h1>
        <p style="color:#cce7ff;margin:4px 0 0;font-size:0.85rem;">Service de nettoyage professionnel</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1a3a5c;border-bottom:2px solid #4fc3f7;padding-bottom:10px;">
          FACTURE #${clean(facture_numero) || 'N/A'}
        </h2>
        <table style="width:100%;margin-bottom:24px;">
          <tr><td style="color:#666;padding:4px 0;">Client</td><td style="font-weight:bold;">${clean(client_nom)}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Adresse</td><td>${clean(client_adresse) || 'N/A'}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Date</td><td>${clean(date_facture) || 'N/A'}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Echeance</td><td>${clean(date_echeance) || 'N/A'}</td></tr>
        </table>
        <div style="background:#f5f7fa;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="color:#1a3a5c;margin:0 0 10px;">Description du travail</h3>
          <p style="margin:0;line-height:1.6;">${clean(description)}</p>
        </div>
        <div style="background:#1a3a5c;border-radius:8px;padding:16px;text-align:right;">
          <span style="color:#cce7ff;font-size:0.9rem;">MONTANT TOTAL</span>
          <div style="color:#4fc3f7;font-size:1.8rem;font-weight:bold;">${clean(montant)}</div>
        </div>
        ${clean(note) ? `<p style="margin-top:20px;color:#555;font-size:0.9rem;font-style:italic;">${clean(note)}</p>` : ''}
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="color:#888;font-size:0.82rem;text-align:center;">
          ENTRETIEN S.O &nbsp;|&nbsp; 438 526-9155 &nbsp;|&nbsp; charronsamy@hotmail.com
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ENTRETIEN S.O" <${process.env.GMAIL_USER}>`,
      to: client_email,
      subject: `Facture #${clean(facture_numero) || 'N/A'} â€“ ENTRETIEN S.O`,
      html
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi.' });
  }
});

// â”€â”€ Route: RDV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/rdv', async (req, res) => {
  const { from_name, from_email, telephone, adresse, date_rdv, message } = req.body;
  if (!from_name || !from_email || !date_rdv) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }
  try {
    await transporter.sendMail({
      from: `"Site ENTRETIEN S.O" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `Nouvelle demande de RDV â€“ ${clean(from_name)}`,
      text: `Nom: ${clean(from_name)}\nCourriel: ${clean(from_email)}\nTel: ${clean(telephone)}\nAdresse: ${clean(adresse)}\nDate: ${clean(date_rdv)}\n\n${clean(message)}`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur envoi.' });
  }
});

// â”€â”€ Route: Soumission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/soumission', async (req, res) => {
  const { nom, from_email, telephone, adresse, type_batiment, nb_conduits, derniere_fois, message } = req.body;
  if (!nom || !from_email) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }
  try {
    await transporter.sendMail({
      from: `"Site ENTRETIEN S.O" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `Nouvelle soumission â€“ ${clean(nom)}`,
      text: `Nom: ${clean(nom)}\nCourriel: ${clean(from_email)}\nTel: ${clean(telephone)}\nAdresse: ${clean(adresse)}\nType: ${clean(type_batiment)}\nConduits: ${clean(nb_conduits)}\nDernier nettoyage: ${clean(derniere_fois)}\n\n${clean(message)}`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur envoi.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur ENTRETIEN S.O sur port ${PORT}`));
