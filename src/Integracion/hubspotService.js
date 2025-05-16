import axios from 'axios';

function getHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function upsertContact(contactPayload, token) {
  const url = 'https://api.hubapi.com/crm/v3/objects/contacts';
  return axios.post(url, contactPayload, { headers: getHeaders(token) });
}

export async function upsertCompany(companyPayload, token) {
  const url = 'https://api.hubapi.com/crm/v3/objects/companies';
  return axios.post(url, companyPayload, { headers: getHeaders(token) });
}

