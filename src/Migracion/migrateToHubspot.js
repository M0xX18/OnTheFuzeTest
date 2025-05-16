import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
console.log('Token de HubSpot:', process.env.SOURCE_HUBSPOT_TOKEN);

const TOKEN = process.env.SOURCE_HUBSPOT_TOKEN;

const BASE = 'https://api.hubapi.com';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

const dataFilePath = path.resolve(__dirname, '..', '..', 'data', 'data.json');

// data/data.json
function readData() {
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Formato YYYY-MM-DD
function formatDatePicker(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Crear/actualizar
async function migrateCompany(company) {
  const url = `${BASE}/crm/v3/objects/companies`;
  const props = {
    location_id: company.location_id.toString(),
    name: company.name,
    location_type: company.location_type,
    dimension: company.dimension,
    creation_date: formatDatePicker(company.creation_date),
  };
  console.log('Migrando Empresa:', props);
  try {
    const { data } = await axios.post(url, { properties: props }, { headers });
    return data.id;
  } catch (err) {
    if (err.response?.status === 409) {
      return await findCompanyHubId(company.location_id);
    }
    throw err;
  }
}

// Crear/actualizar
async function migrateContact(contact) {
  const url = `${BASE}/crm/v3/objects/contacts`;
  const props = {
    character_id: contact.character_id.toString(),
    firstname: contact.firstname,
    lastname: contact.lastname,
    status_character: contact.status_character,
    character_species: contact.character_species,
    character_gender: contact.character_gender,
  };
  console.log('Migrando Contacto:', props);
  try {
    const { data } = await axios.post(url, { properties: props }, { headers });
    return data.id;
  } catch (err) {
    if (err.response?.status === 409) {
      return await findContactHubId(contact.character_id);
    }
    throw err;
  }
}

// Buscar ID de contacto por character_id
async function findContactHubId(characterId) {
  const url = `${BASE}/crm/v3/objects/contacts/search`;
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'character_id', operator: 'EQ', value: characterId.toString() }] }],
    properties: [],
    limit: 1
  };
  const { data } = await axios.post(url, body, { headers });
  return data.results?.[0]?.id || null;
}

// Buscar ID de empresa por location_id
async function findCompanyHubId(locationId) {
  const url = `${BASE}/crm/v3/objects/companies/search`;
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'location_id', operator: 'EQ', value: locationId.toString() }] }],
    properties: [],
    limit: 1
  };
  const { data } = await axios.post(url, body, { headers });
  return data.results?.[0]?.id || null;
}

// Asociar contacto con empresa
async function associate(contactHubId, companyHubId) {
  const url = `${BASE}/crm/v3/objects/contacts/${contactHubId}/associations/companies/${companyHubId}/contact_to_company`;
  await axios.put(url, {}, { headers });
}

async function migrateData() {
  const { contacts, companies, associations } = readData();

  // Migrar empresas
  console.log('\n Migrando empresas...');
  for (const comp of companies) {
    try {
      const id = await migrateCompany(comp);
      console.log(`Empresa procesada (${comp.name}) con ID: ${id}`);
    } catch (err) {
      console.error(`Error empresa ${comp.name}:`, err.response?.data || err.message);
    }
  }

  // Migrar contactos
  console.log('\n Migrando contactos...');
  for (const ct of contacts) {
    try {
      const id = await migrateContact(ct);
      console.log(`Contacto procesado (${ct.firstname} ${ct.lastname}) con ID: ${id}`);
    } catch (err) {
      console.error(`Error contacto ${ct.firstname}:`, err.response?.data || err.message);
    }
  }

  // Asociaciones
  console.log('\n Asociando contactos con empresas...');
  for (const { character_id, location_id } of associations) {
    try {
      const contactId = await findContactHubId(character_id);
      const companyId = await findCompanyHubId(location_id);

      if (!contactId) throw new Error(`Contacto no encontrado (character_id: ${character_id})`);
      if (!companyId) throw new Error(`Empresa no encontrada (location_id: ${location_id})`);

      await associate(contactId, companyId);
      console.log(` Asociado contacto (${character_id}) con empresa (${location_id})`);
    } catch (err) {
      console.error(`Error asociación ${character_id}→${location_id}:`, err.response?.data || err.message);
    }
  }

  console.log('\n Migración completa.');
}

migrateData();

