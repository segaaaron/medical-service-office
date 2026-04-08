# API — Home (`/api/home`)

Servicio que gestiona el contenido de la página de inicio. Agrupa dos secciones: **Hero** y **Preguntas Frecuentes (FAQ)**. Existe un único registro en base de datos; el `PUT` crea o actualiza ese registro (upsert).

---

## Endpoints

### `GET /api/home`

Obtiene el contenido actual de la página de inicio.

- **Autenticación:** No requerida (público)
- **Body:** Ninguno

#### Respuesta exitosa `200`

```json
{
  "id": "uuid",
  "specialties": "MEDICINA ESTÉTICA · REJUVENECIMIENTO · TRATAMIENTOS CORPORALES",
  "doctorName": "Dra. Yasmin Medrano Avila",
  "subtitle": "Medicina Estética Avanzada",
  "description": "Realza tu belleza natural con tratamientos seguros y efectivos diseñados especialmente para ti.",
  "highlightedText": "tratamientos seguros y efectivos",
  "btn1Text": "VER TRATAMIENTOS",
  "btn2Text": "AGENDA TU CITA",
  "stat1Value": "10+",
  "stat1Label": "AÑOS DE EXPERIENCIA",
  "stat2Value": "5000+",
  "stat2Label": "PACIENTES SATISFECHOS",
  "stat3Value": "30+",
  "stat3Label": "TRATAMIENTOS DISPONIBLES",
  "faqSectionLabel": "¿TIENES PREGUNTAS?",
  "faqTitle": "Preguntas Frecuentes",
  "faqs": [
    {
      "question": "¿Los tratamientos de medicina estética son seguros?",
      "answer": "Sí. Todos los tratamientos que ofrecemos en el consultorio de la Dra. Yasmin Medrano Avila están avalados médicamente y se realizan con productos certificados y equipos de última tecnología."
    },
    {
      "question": "¿Cuánto tiempo duran los resultados del botox?",
      "answer": "Los resultados del botox duran entre 4 y 6 meses dependiendo del área tratada y el metabolismo del paciente."
    },
    {
      "question": "¿El procedimiento con ácido hialurónico duele?",
      "answer": "El procedimiento es mínimamente invasivo. Se aplica anestesia tópica para reducir al máximo cualquier molestia."
    }
  ],
  "createdAt": "2026-04-07T00:00:00.000Z",
  "updatedAt": "2026-04-07T00:00:00.000Z"
}
```

#### Respuesta cuando no hay contenido `404`

```json
{
  "error": "Home content not found"
}
```

---

### `PUT /api/home`

Crea o actualiza el contenido de la página de inicio. Todos los campos son opcionales; se pueden enviar solo los que se quieran actualizar.

- **Autenticación:** Requerida — Bearer Token
- **Content-Type:** `application/json`

#### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Body (todos los campos son opcionales)

```json
{
  "specialties": "MEDICINA ESTÉTICA · REJUVENECIMIENTO · TRATAMIENTOS CORPORALES",
  "doctorName": "Dra. Yasmin Medrano Avila",
  "subtitle": "Medicina Estética Avanzada",
  "description": "Realza tu belleza natural con tratamientos seguros y efectivos diseñados especialmente para ti.",
  "highlightedText": "tratamientos seguros y efectivos",
  "btn1Text": "VER TRATAMIENTOS",
  "btn2Text": "AGENDA TU CITA",
  "stat1Value": "10+",
  "stat1Label": "AÑOS DE EXPERIENCIA",
  "stat2Value": "5000+",
  "stat2Label": "PACIENTES SATISFECHOS",
  "stat3Value": "30+",
  "stat3Label": "TRATAMIENTOS DISPONIBLES",
  "faqSectionLabel": "¿TIENES PREGUNTAS?",
  "faqTitle": "Preguntas Frecuentes",
  "faqs": [
    {
      "question": "¿Los tratamientos de medicina estética son seguros?",
      "answer": "Sí. Todos los tratamientos que ofrecemos en el consultorio de la Dra. Yasmin Medrano Avila están avalados médicamente y se realizan con productos certificados y equipos de última tecnología."
    },
    {
      "question": "¿Cuánto tiempo duran los resultados del botox?",
      "answer": "Los resultados del botox duran entre 4 y 6 meses dependiendo del área tratada y el metabolismo del paciente."
    },
    {
      "question": "¿El procedimiento con ácido hialurónico duele?",
      "answer": "El procedimiento es mínimamente invasivo. Se aplica anestesia tópica para reducir al máximo cualquier molestia."
    },
    {
      "question": "¿Cuántas sesiones necesito para ver resultados en tratamientos corporales?",
      "answer": "Depende del tratamiento. En general se recomiendan entre 4 y 8 sesiones para resultados óptimos."
    },
    {
      "question": "¿Cuánto tiempo dura una sesión de depilación láser?",
      "answer": "Una sesión dura entre 20 y 60 minutos según el área a tratar."
    },
    {
      "question": "¿Qué debo hacer antes de mi primera consulta?",
      "answer": "No es necesaria ninguna preparación especial. Se recomienda llegar sin maquillaje si el tratamiento es facial."
    },
    {
      "question": "¿Cuándo puedo ver resultados en el rejuvenecimiento facial?",
      "answer": "Los primeros resultados se aprecian entre la primera y segunda semana posterior al tratamiento."
    }
  ]
}
```

#### Respuesta exitosa `200`

Retorna el objeto completo actualizado (misma estructura que el `GET`).

#### Respuesta sin autenticación `401`

```json
{
  "error": "Missing or malformed Authorization header"
}
```

---

## Descripción de campos

### Sección Hero

| Campo | Tipo | Descripción |
|---|---|---|
| `specialties` | string | Texto superior del hero (categorías separadas por `·`) |
| `doctorName` | string | Nombre completo de la doctora |
| `subtitle` | string | Subtítulo en cursiva bajo el nombre |
| `description` | string | Párrafo descriptivo del hero |
| `highlightedText` | string | Fragmento del párrafo que se resalta en color dorado |
| `btn1Text` | string | Texto del botón primario |
| `btn2Text` | string | Texto del botón secundario |
| `stat1Value` | string | Valor de la primera estadística (ej. `"10+"`) |
| `stat1Label` | string | Etiqueta de la primera estadística (ej. `"AÑOS DE EXPERIENCIA"`) |
| `stat2Value` | string | Valor de la segunda estadística |
| `stat2Label` | string | Etiqueta de la segunda estadística |
| `stat3Value` | string | Valor de la tercera estadística |
| `stat3Label` | string | Etiqueta de la tercera estadística |

### Sección FAQ

| Campo | Tipo | Descripción |
|---|---|---|
| `faqSectionLabel` | string | Etiqueta superior de la sección (ej. `"¿TIENES PREGUNTAS?"`) |
| `faqTitle` | string | Título principal de la sección (ej. `"Preguntas Frecuentes"`) |
| `faqs` | array | Lista de preguntas y respuestas |
| `faqs[].question` | string | Texto de la pregunta |
| `faqs[].answer` | string | Texto de la respuesta |

---

## Ejemplo de integración en JavaScript (fetch)

### Obtener contenido

```js
const response = await fetch('https://tu-api.com/api/home');
const home = await response.json();

// Hero
console.log(home.doctorName);     // "Dra. Yasmin Medrano Avila"
console.log(home.specialties);    // "MEDICINA ESTÉTICA · REJUVENECIMIENTO · TRATAMIENTOS CORPORALES"
console.log(home.stat1Value);     // "10+"

// FAQs
home.faqs.forEach(faq => {
  console.log(faq.question);
  console.log(faq.answer);
});
```

### Actualizar contenido (requiere token)

```js
const token = 'tu_access_token';

const response = await fetch('https://tu-api.com/api/home', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    doctorName: 'Dra. Yasmin Medrano Avila',
    stat1Value: '12+',
    faqs: [
      {
        question: '¿Los tratamientos son seguros?',
        answer: 'Sí, todos están avalados médicamente.',
      },
    ],
  }),
});

const updated = await response.json();
console.log(updated);
```
