import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIdsUpTo } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener el número total de personajes
async function fetchTotalCharacters() {
  const { data } = await axios.get('https://rickandmortyapi.com/api/character');
  return data.info.count;
}

// Obtener los personajes según IDs primos
async function fetchAllCharacters() {
  const max = await fetchTotalCharacters();
  const ids = getIdsUpTo(max);
  const characters = [];

  for (const id of ids) {
    try {
      const { data } = await axios.get(`https://rickandmortyapi.com/api/character/${id}`);
      characters.push(data);
    } catch (error) {
      console.error(`Error al traer personaje ${id}:`, error.message);
    }
  }

  return characters;
}

// Mapeo de personaje a contacto HubSpot
function mapCharacterToContact(character) {
  return {
    character_id: character.id,
    firstname: character.name.split(' ')[0] || character.name,
    lastname: character.name.split(' ').slice(1).join(' ') || character.name,
    status_character: character.status,
    character_species: character.species,
    character_gender: character.gender
  };
}

// Mapeo de ubicación a compañía HubSpot
function mapLocationToCompany(location) {
  return {
    location_id: location.id,
    name: location.name,
    location_type: location.type,
    dimension: location.dimension,
    creation_date: location.created
  };
}

// Obtener una ubicación por URL
async function fetchLocationByUrl(url) {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(`Error al traer ubicación ${url}:`, error.message);
    return null;
  }
}

// Función principal
async function run() {
  const characters = await fetchAllCharacters();
  const contacts = characters.map(mapCharacterToContact);

  // Obtener URLs únicas de ubicaciones válidas
  const locationUrls = [
    ...new Set(
      characters
        .map(c => c.location && c.location.url)
        .filter(url => typeof url === 'string' && url.trim() !== '')
    )
  ];

  // Obtener ubicaciones y mapearlas
  const urlToLocation = {};
  for (const url of locationUrls) {
    const location = await fetchLocationByUrl(url);
    if (location) {
      urlToLocation[url] = location;
    }
  }

  const companies = Object.values(urlToLocation).map(mapLocationToCompany);

  // Crear asociaciones entre characters y locations
  const associations = characters
    .filter(c => c.location && c.location.url && urlToLocation[c.location.url])
    .map(c => ({
      character_id: c.id,
      location_id: urlToLocation[c.location.url].id
    }));

  const result = {
    contacts,
    companies,
    associations
  };

  const filePath = path.join(__dirname, '..', 'data', 'data.json');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  console.log(`Datos guardados en: ${filePath}`);
}

run();

