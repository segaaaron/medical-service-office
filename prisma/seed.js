require('../src/config/env');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // ── Users ────────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'dramedranoyasmin@gmail.com';
  const adminName  = process.env.SEED_ADMIN_NAME  || 'Dra. Yasmin Medrano';
  const adminPass  = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@2026', 10);

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { password: adminPass, name: adminName },
    create: { email: adminEmail, name: adminName, password: adminPass },
  });
  console.log(`User upserted: ${admin.email}`);

  const secondEmail = process.env.SEED_SECOND_EMAIL || 'recepcion@consultorio.com';
  const secondPass  = await bcrypt.hash(process.env.SEED_SECOND_PASSWORD || 'Recepcion@2026', 10);

  const reception = await prisma.user.upsert({
    where:  { email: secondEmail },
    update: { password: secondPass, name: 'Recepción' },
    create: { email: secondEmail, name: 'Recepción', password: secondPass },
  });
  console.log(`User upserted: ${reception.email}`);

  // ── Treatments ───────────────────────────────────────────────────────────
  const treatments = [
    {
      name:            'Limpieza Dental',
      slug:            'limpieza-dental',
      description:     'Eliminación de sarro y placa bacteriana para mantener encías y dientes sanos.',
      longDescription: 'Procedimiento preventivo que incluye ultrasonido, pulido y aplicación de flúor. Recomendado cada 6 meses.',
      price:           350,
      category:        'Prevención',
      active:          true,
    },
    {
      name:            'Blanqueamiento Dental',
      slug:            'blanqueamiento-dental',
      description:     'Aclaramiento del tono de los dientes con gel profesional de peróxido de hidrógeno.',
      longDescription: 'Sesión en consultorio de 60-90 min con lámpara de activación. Resultados visibles desde la primera cita.',
      price:           1200,
      category:        'Estética',
      active:          true,
    },
    {
      name:            'Ortodoncia con Brackets Metálicos',
      slug:            'ortodoncia-brackets-metalicos',
      description:     'Corrección de la alineación dental con brackets metálicos de alta durabilidad.',
      longDescription: 'Tratamiento de 18-24 meses. Incluye consultas de seguimiento mensuales y retención al finalizar.',
      price:           18000,
      category:        'Ortodoncia',
      active:          true,
    },
    {
      name:            'Extracción Simple',
      slug:            'extraccion-simple',
      description:     'Extracción de piezas dentales con anestesia local en condiciones de mínima complejidad.',
      longDescription: 'Incluye radiografía diagnóstica, anestesia local y medicación post-operatoria básica.',
      price:           600,
      category:        'Cirugía',
      active:          true,
    },
  ];

  for (const t of treatments) {
    const result = await prisma.treatment.upsert({
      where:  { slug: t.slug },
      update: { price: t.price, active: t.active },
      create: t,
    });
    console.log(`Treatment upserted: ${result.name}`);
  }

  // ── Blog Posts ───────────────────────────────────────────────────────────
  const posts = [
    {
      title:       '¿Con qué frecuencia debes visitar al dentista?',
      slug:        'frecuencia-visitas-dentista',
      excerpt:     'Descubre por qué las visitas preventivas son clave para mantener tu salud bucal a largo plazo.',
      content:     `La mayoría de los expertos recomienda acudir al dentista al menos dos veces al año, aunque la frecuencia ideal depende de cada persona.

**¿Por qué es importante la visita periódica?**

Durante una revisión rutinaria el dentista puede detectar caries en etapas tempranas, revisar el estado de las encías y realizar una limpieza profesional que elimina el sarro acumulado. Estos procedimientos preventivos evitan tratamientos más costosos e invasivos en el futuro.

**Factores que pueden requerir visitas más frecuentes**

- Historial de caries o enfermedad periodontal
- Diabetes u otras condiciones que afectan la salud bucal
- Fumadores o usuarios de tabaco
- Pacientes con brackets u ortodoncia fija

Si tienes dudas, agenda una consulta con nosotros y te orientaremos sobre el plan de seguimiento más adecuado para ti.`,
      published:   true,
      publishedAt: new Date('2026-01-15T09:00:00Z'),
    },
    {
      title:       'Guía completa del blanqueamiento dental profesional',
      slug:        'guia-blanqueamiento-dental-profesional',
      excerpt:     'Todo lo que necesitas saber antes de someterte a un blanqueamiento dental en consultorio.',
      content:     `El blanqueamiento dental es uno de los tratamientos estéticos más solicitados. Aquí te explicamos cómo funciona y qué esperar.

**¿Cómo funciona?**

Se aplica un gel de peróxido de hidrógeno o carbamida sobre los dientes. Una lámpara de activación acelera la reacción química que rompe las moléculas de pigmento, aclarando el tono del esmalte entre 4 y 8 tonos.

**¿Quiénes son buenos candidatos?**

Personas con dientes sanos y encías en buen estado. No está indicado en pacientes con caries activas, enfermedad periodontal o restauraciones visibles en el sector anterior.

**Cuidados posteriores**

- Evita alimentos o bebidas pigmentadas las primeras 48 h (café, vino tinto, té)
- Usa pasta dental sensibilizante si experimentas molestias
- El resultado puede durar 1-2 años con buenos hábitos de higiene

Contáctanos para evaluar si eres candidato ideal.`,
      published:   true,
      publishedAt: new Date('2026-02-10T10:00:00Z'),
    },
    {
      title:       'Todo sobre la ortodoncia invisible',
      slug:        'ortodoncia-invisible-alineadores',
      excerpt:     'Los alineadores transparentes son una alternativa discreta y cómoda a los brackets tradicionales.',
      content:     `La ortodoncia invisible ha revolucionado el tratamiento de maloclusiones gracias a su discreción y comodidad.

**¿Cómo funcionan los alineadores?**

Son férulas de plástico transparente fabricadas a medida mediante escáner 3D. Cada serie de alineadores ejerce una presión gradual y controlada para mover los dientes a la posición deseada.

**Ventajas frente a los brackets**

- Casi imperceptibles
- Removibles para comer e higienizarse
- Menos visitas de ajuste

**¿Son para todos?**

Son ideales para casos de complejidad leve a moderada. Para casos severos, los brackets convencionales siguen siendo la opción más eficaz.

Agenda tu consulta de valoración sin costo para conocer tu caso.`,
      published:   false,
      publishedAt: null,
    },
  ];

  for (const p of posts) {
    const result = await prisma.blogPost.upsert({
      where:  { slug: p.slug },
      update: { published: p.published, publishedAt: p.publishedAt },
      create: p,
    });
    console.log(`BlogPost upserted: ${result.title}`);
  }

  // ── Appointments ─────────────────────────────────────────────────────────
  const cleaningTreatment = await prisma.treatment.findUnique({ where: { slug: 'limpieza-dental' } });
  const whiteningTreatment = await prisma.treatment.findUnique({ where: { slug: 'blanqueamiento-dental' } });

  const appointments = [
    {
      patientName:   'María González Ruiz',
      patientPhone:  '5512345678',
      patientEmail:  'maria.gonzalez@email.com',
      treatmentId:   cleaningTreatment?.id ?? null,
      treatmentName: 'Limpieza Dental',
      notes:         'Primera visita, refiere sensibilidad en molares superiores.',
      status:        'CONFIRMED',
      scheduledAt:   new Date('2026-04-05T10:00:00Z'),
    },
    {
      patientName:   'Carlos Ramírez López',
      patientPhone:  '5598765432',
      patientEmail:  'carlos.ramirez@email.com',
      treatmentId:   whiteningTreatment?.id ?? null,
      treatmentName: 'Blanqueamiento Dental',
      notes:         'Paciente interesado en aclarar 6-8 tonos antes de boda en junio.',
      status:        'PENDING',
      scheduledAt:   new Date('2026-04-08T12:00:00Z'),
    },
    {
      patientName:   'Sofía Hernández Mora',
      patientPhone:  '5567891234',
      patientEmail:  null,
      treatmentId:   null,
      treatmentName: 'Consulta General',
      notes:         'Dolor en tercer molar inferior derecho.',
      status:        'PENDING',
      scheduledAt:   new Date('2026-04-10T09:00:00Z'),
    },
    {
      patientName:   'Roberto Jiménez Torres',
      patientPhone:  '5543218765',
      patientEmail:  'roberto.jimenez@email.com',
      treatmentId:   cleaningTreatment?.id ?? null,
      treatmentName: 'Limpieza Dental',
      notes:         null,
      status:        'COMPLETED',
      scheduledAt:   new Date('2026-03-20T11:00:00Z'),
    },
  ];

  for (const a of appointments) {
    const existing = await prisma.appointment.findFirst({
      where: { patientPhone: a.patientPhone, scheduledAt: a.scheduledAt },
    });
    if (!existing) {
      const result = await prisma.appointment.create({ data: a });
      console.log(`Appointment created: ${result.patientName} - ${result.treatmentName}`);
    } else {
      console.log(`Appointment already exists: ${a.patientName} - ${a.treatmentName}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
