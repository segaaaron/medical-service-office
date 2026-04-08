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
      active:          true,
    },
    {
      name:            'Blanqueamiento Dental',
      slug:            'blanqueamiento-dental',
      description:     'Aclaramiento del tono de los dientes con gel profesional de peróxido de hidrógeno.',
      longDescription: 'Sesión en consultorio de 60-90 min con lámpara de activación. Resultados visibles desde la primera cita.',
      price:           1200,
      active:          true,
    },
    {
      name:            'Ortodoncia con Brackets Metálicos',
      slug:            'ortodoncia-brackets-metalicos',
      description:     'Corrección de la alineación dental con brackets metálicos de alta durabilidad.',
      longDescription: 'Tratamiento de 18-24 meses. Incluye consultas de seguimiento mensuales y retención al finalizar.',
      price:           18000,
      active:          true,
    },
    {
      name:            'Extracción Simple',
      slug:            'extraccion-simple',
      description:     'Extracción de piezas dentales con anestesia local en condiciones de mínima complejidad.',
      longDescription: 'Incluye radiografía diagnóstica, anestesia local y medicación post-operatoria básica.',
      price:           600,
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
  // ── Site Content (Dashboard Home) ─────────────────────────────────────
  const defaultSiteContent = {
    branding: {
      doctorName: 'Dra. Yasmin Medrano Avila',
      specialty: 'Medicina Estética Avanzada',
      city: 'Santa Cruz de la Sierra',
      whatsappNumber: '+59178751894',
      whatsappUrl: 'https://wa.me/59178751894',
      heroTagline: 'Realza tu belleza natural con tratamientos estéticos de vanguardia',
      heroSubtitle: 'Medicina estética avanzada con resultados naturales y seguros',
      heroBackgroundImage: '',
      aboutImage: '',
      aboutBadge: 'Más de 10 años de experiencia',
      footerDescription: 'Consultorio especializado en medicina estética avanzada.',
      copyright: '© 2026 Dra. Yasmin Medrano Avila. Todos los derechos reservados.',
    },
    sectionHeaders: {
      value: { title: 'Nuestros Valores', subtitle: '¿Por qué elegirnos?' },
      course: { title: 'Agenda tu Cita', subtitle: 'Tratamientos personalizados' },
      presets: { title: 'Tratamientos Destacados', subtitle: 'Conoce nuestras especialidades' },
      freeResources: { title: 'Recursos Gratuitos', subtitle: 'Guías para tu cuidado personal' },
      faq: { title: 'Preguntas Frecuentes', subtitle: 'Resolvemos tus dudas' },
    },
    promoBanner: {
      text: '¡Promo especial! Biorevitalización NCTF 135 HA con 20% de descuento',
      ctaLabel: 'Agendar por WhatsApp',
      ctaHref: 'https://wa.me/59178751894?text=Hola%20quiero%20info%20de%20la%20promo%20NCTF',
    },
    promoPopup: {
      emoji: '🎉',
      label: 'Oferta Especial',
      title: 'Primera consulta de valoración GRATIS',
      description: 'Agenda tu consulta de valoración sin costo y descubre el tratamiento ideal para ti.',
      location: 'Santa Cruz de la Sierra',
      ctaLabel: 'Agendar Ahora',
      ctaHref: 'https://wa.me/59178751894?text=Hola%20quiero%20agendar%20una%20consulta%20de%20valoracion',
      dismissLabel: 'Ahora no, gracias',
    },
    heroStats: [
      { value: '10+', label: 'Años de experiencia' },
      { value: '5000+', label: 'Pacientes atendidos' },
      { value: '30+', label: 'Tratamientos' },
    ],
    heroCTAs: [
      { label: 'Ver Tratamientos', href: '/tratamientos', variant: 'primary' },
      { label: 'Agendar Cita', href: '/contacto', variant: 'secondary' },
    ],
    valueFeatures: [
      { iconName: 'Sparkles', title: 'Resultados Naturales', description: 'Técnicas avanzadas que realzan tu belleza sin alterar tu esencia.' },
      { iconName: 'Shield', title: 'Tecnología de Punta', description: 'Equipos de última generación para tratamientos seguros y efectivos.' },
      { iconName: 'Heart', title: 'Atención Personalizada', description: 'Cada tratamiento es diseñado específicamente para tus necesidades.' },
      { iconName: 'Star', title: 'Bienestar Integral', description: 'Enfoque holístico que cuida tu salud y apariencia por igual.' },
    ],
    courseIncluded: [
      { iconName: 'CheckCircle', text: 'Valoración inicial personalizada' },
      { iconName: 'CheckCircle', text: 'Plan de tratamiento a medida' },
      { iconName: 'CheckCircle', text: 'Seguimiento post-tratamiento' },
      { iconName: 'CheckCircle', text: 'Productos de grado médico' },
      { iconName: 'CheckCircle', text: 'Ambiente seguro y confortable' },
      { iconName: 'CheckCircle', text: 'Resultados garantizados' },
    ],
    courseModules: [
      { title: 'Toxina Botulínica (Botox)' },
      { title: 'Rellenos con Ácido Hialurónico' },
      { title: 'Bioestimulación con Polinucleótidos' },
      { title: 'Skinbooster / Hidratación Profunda' },
      { title: 'Mesoterapia Facial' },
      { title: 'Radiofrecuencia Facial y Corporal' },
      { title: 'Depilación Láser' },
      { title: 'Tratamiento de Manchas' },
      { title: 'Peeling Químico' },
      { title: 'Reducción de Medidas Corporales' },
      { title: 'Tratamiento de Celulitis' },
      { title: 'Tratamiento de Estrías' },
    ],
    coursePricing: {
      earlyBird: 0,
      regular: 150000,
      currency: '$',
      savings: 150000,
    },
    presets: [
      { name: 'Tratamientos Faciales', description: 'Botox, rellenos, skinbooster y más para rejuvenecer tu rostro.', tag: 'Popular', tagColor: 'blue' },
      { name: 'Medicina Regenerativa', description: 'Bioestimuladores de colágeno y polinucleótidos para regeneración natural.', tag: 'Innovador', tagColor: 'green' },
      { name: 'Tratamientos Corporales', description: 'Reducción de medidas, celulitis y tonificación corporal.', tag: 'Resultados', tagColor: 'purple' },
      { name: 'Depilación Láser', description: 'Eliminación definitiva del vello con tecnología láser de última generación.', tag: 'Permanente', tagColor: 'pink' },
      { name: 'Hidratación y Nutrición', description: 'Mesoterapia y protocolos de nutrición cutánea profunda.', tag: 'Bienestar', tagColor: 'teal' },
      { name: 'Estrías y Cicatrices', description: 'Tratamientos especializados para mejorar la textura de la piel.', tag: 'Especializado', tagColor: 'orange' },
    ],
    freePDFs: [
      { title: 'Guía de Medicina Facial', description: 'Todo lo que necesitas saber antes de tu primer tratamiento estético.', icon: 'FileText' },
      { title: 'Preparación para tu Consulta', description: 'Cómo prepararte para obtener los mejores resultados.', icon: 'ClipboardList' },
      { title: 'Cuidados Post-Tratamiento', description: 'Guía completa de cuidados después de tu procedimiento.', icon: 'Heart' },
    ],
    freeResourcesForm: {
      heading: 'Descarga tu guía gratuita',
      description: 'Ingresa tu correo electrónico y recibe nuestra guía de cuidados estéticos.',
      placeholder: 'tu@email.com',
      buttonLabel: 'Descargar Guía',
      privacyText: 'Respetamos tu privacidad. No compartimos tu información.',
      successTitle: '¡Listo!',
      successMessage: 'Revisa tu bandeja de entrada para descargar tu guía.',
    },
    about: {
      bio: [
        'La Dra. Yasmin Medrano Avila es especialista en Medicina Estética Avanzada con más de 10 años de experiencia en tratamientos faciales y corporales.',
        'Formada en las mejores instituciones de Latinoamérica y Europa, combina técnica de vanguardia con un enfoque natural y personalizado para cada paciente.',
        'Su filosofía se centra en realzar la belleza natural de cada persona, utilizando los tratamientos más seguros y efectivos disponibles en la medicina estética moderna.',
      ],
      stats: [
        { value: '10+', label: 'Años de experiencia' },
        { value: '5000+', label: 'Pacientes atendidos' },
        { value: '30+', label: 'Tratamientos disponibles' },
      ],
    },
    faqs: [
      { question: '¿Los tratamientos estéticos son seguros?', answer: 'Sí, todos nuestros tratamientos son realizados por profesionales certificados con productos aprobados por las autoridades sanitarias.' },
      { question: '¿Cuánto dura el efecto del Botox?', answer: 'El efecto del Botox dura entre 4 y 6 meses, dependiendo del metabolismo de cada paciente y la zona tratada.' },
      { question: '¿Los tratamientos son dolorosos?', answer: 'La mayoría de los tratamientos son mínimamente invasivos. Utilizamos anestesia tópica para garantizar tu comodidad.' },
      { question: '¿Cuántas sesiones necesito?', answer: 'Depende del tratamiento y tus objetivos. En la consulta de valoración diseñamos un plan personalizado.' },
      { question: '¿Qué formación tiene la Dra. Medrano?', answer: 'La Dra. Medrano cuenta con especialización en medicina estética avanzada y certificaciones internacionales en las técnicas más actuales.' },
    ],
    navLinks: [
      { label: 'Inicio', href: '/' },
      { label: 'Tratamientos', href: '/tratamientos' },
      { label: 'Nosotros', href: '/nosotros' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contacto', href: '/contacto' },
    ],
    footerGroups: [
      {
        title: 'Tratamientos Faciales',
        links: [
          { label: 'Toxina Botulínica', href: '/tratamientos' },
          { label: 'Ácido Hialurónico', href: '/tratamientos' },
          { label: 'Skinbooster', href: '/tratamientos' },
          { label: 'Mesoterapia Facial', href: '/tratamientos' },
        ],
      },
      {
        title: 'Tratamientos Corporales',
        links: [
          { label: 'Depilación Láser', href: '/tratamientos' },
          { label: 'Reducción de Medidas', href: '/tratamientos' },
          { label: 'Tratamiento de Celulitis', href: '/tratamientos' },
          { label: 'Radiofrecuencia', href: '/tratamientos' },
        ],
      },
      {
        title: 'Consultorio',
        links: [
          { label: 'Sobre Nosotros', href: '/nosotros' },
          { label: 'Blog', href: '/blog' },
          { label: 'Contacto', href: '/contacto' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Aviso de Privacidad', href: '/privacidad' },
          { label: 'Términos y Condiciones', href: '/terminos' },
        ],
      },
    ],
  };

  const siteContent = await prisma.siteContent.upsert({
    where: { key: 'main' },
    update: { value: defaultSiteContent },
    create: { key: 'main', value: defaultSiteContent },
  });
  console.log(`SiteContent upserted: key=${siteContent.key}`);

  // ── PromoBanner ──────────────────────────────────────────────────────────
  const existingBanner = await prisma.promoBanner.findFirst();
  if (!existingBanner) {
    await prisma.promoBanner.create({
      data: {
        tag: 'Promo Especial',
        title: 'Biorevitalización NCTF 135 HA',
        highlightedText: '20% de descuento',
        whatsappText: 'Agendar por WhatsApp',
        whatsappUrl: 'https://wa.me/59178751894?text=Hola%20quiero%20info%20de%20la%20promo%20NCTF',
        dismissText: 'Ahora no, gracias',
        active: true,
      },
    });
    console.log('PromoBanner created');
  } else {
    console.log('PromoBanner already exists');
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
