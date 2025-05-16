# OnTheFuze Test HubSpot

Este test consiste en realizar una integración con la API de HubSpot. Incluye funcionalidades de migración de datos desde una API pública hacia HubSpot, y también una API de integración que puede recibir datos externos y replicarlos en otra cuenta de HubSpot Mirror.

## Requisitos

* Node.js >= 16
* Una cuenta de HubSpot con al menos dos Private Apps creadas (una como **source** y otra como **mirror**)
* Los tokens de autorización de ambas apps (**SOURCE_HUBSPOT_TOKEN** y **MIRROR_HUBSPOT_TOKEN**)

## Instalacion y Configuracion

1. Clonar repositorio
```BASH
git clone https://github.com/M0xX18/OnTheFuzeTest.git
cd OnTheFuzeTest
```

2. Crear archivo **.env** con tokens de HubSpot

```
SOURCE_HUBSPOT_TOKEN=pat-na1-...
MIRROR_HUBSPOT_TOKEN=pat-na1-...
PORT=3000
```

## Migración

1. Obtener datos desde la API pública

```BASH
node src/Migracion/rickymorty.js
```

2. Migrar a HubSpot usando el token de origen **SOURCE_HUBSPOT_TOKEN**

```BASH
node src/Migracion/migrateToHubspot.js
```

## Integración

### Opcion 1: Ejecutar localmente

Se puede ejecutar el servidor para tener los endpoints localmente con:

```BASH
node src/Integracion/server.js
```

Esto levantará el servidor en el puerto 3000 o en el definido por el archivo **.env**

* Endpoint para contactos: **http://localhost:3000/webhook/contact**
* Endpoint para empresas: **http://localhost:3000/webhook/company**

Ambos endpoints permiten unicamente solicitudes **POST** con el body requerido para ser replicados en la cuenta espejo.

### Opcion 2: Usar la API ya desplegada

También se puede usar la API ya desplegada en Render:

* **https://onthefuzetest.onrender.com/webhook/contact**
* **https://onthefuzetest.onrender.com/webhook/company**
