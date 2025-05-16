import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MIRROR_TOKEN = process.env.MIRROR_HUBSPOT_TOKEN;
if (!MIRROR_TOKEN) {
  console.error('No se encontró MIRROR_HUBSPOT_TOKEN en .env');
  process.exit(1);
}

const BASE_URL = 'https://api.hubapi.com';
const hubspotHeaders = {
  headers: {
    Authorization: `Bearer ${MIRROR_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const CONTACT_WHITELIST = [
  'character_id',
  'firstname',
  'lastname',
  'status_character',
  'character_species',
  'character_gender'
];

const COMPANY_WHITELIST = [
  'location_id',
  'name',
  'location_type',
  'dimension',
  'creation_date'
];

function extractProps(hsProps = {}, whitelist = []) {
  const out = {};
  for (const key of whitelist) {
    const entry = hsProps[key];
    if (entry && typeof entry.value !== 'undefined') {
      out[key] = entry.value;
    }
  }
  return out;
}

// ——— Endpoint para Contactos ———
app.post('/webhook/contact', async (req, res) => {
  const hsProps = req.body.properties || {};
  const props = extractProps(hsProps, CONTACT_WHITELIST);

  console.log('Contacto a mirror:', props);

  try {
    const mirrorRes = await axios.post(
      `${BASE_URL}/crm/v3/objects/contacts`,
      { properties: props },
      hubspotHeaders
    );

    return res.status(200).json({
      status: 'success',
      mirrorId: mirrorRes.data.id
    });
  } catch (err) {
    console.error('Error al crear contacto mirror:', err.response?.data || err.message);
    return res.status(500).json({
      status: 'error',
      message: err.response?.data?.message || err.message
    });
  }
});

// ——— Endpoint para Empresas ———
app.post('/webhook/company', async (req, res) => {
  const hsProps = req.body.properties || {};
  const props = extractProps(hsProps, COMPANY_WHITELIST);

  console.log('Company a mirror:', props);

  try {
    const mirrorRes = await axios.post(
      `${BASE_URL}/crm/v3/objects/companies`,
      { properties: props },
      hubspotHeaders
    );

    return res.status(200).json({
      status: 'success',
      mirrorId: mirrorRes.data.id
    });
  } catch (err) {
    console.error('Error al crear empresa espejo:', err.response?.data || err.message);
    return res.status(500).json({
      status: 'error',
      message: err.response?.data?.message || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Integración Mirror escuchando en puerto ${PORT}`);
});

