import { PrismaClient, LocationType, AppointmentStatus } from "@prisma/client";
import "dotenv/config";
const connectionString = `${process.env.DATABASE_URL}`;
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando sembrado de datos (Seeding)...");

  console.log("🔐 Creando Usuario Admin...");
  const passwordHash = await hash("123123", 10);

  await prisma.user.upsert({
    where: { email: "anamimasoterapia@anami.cl" },
    update: {},
    create: {
      email: "anamimasoterapia@anami.cl",
      fullName: "Administrador Anami",
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // ----------------------------------------------------------------------
  // 1. SERVICIOS (Catálogo Oficial Anami)
  // ----------------------------------------------------------------------
  console.log("💆‍♀️ Creando Servicios...");

  const servicios = [
    {
      id: "41831bfe-bf2b-4a8f-8588-8ffd7741d3bc",
      name: "Masaje Descontracturante",
      description:
        "Enfoque en liberar la tensión muscular profunda en cuello, espalda y hombros. Ideal para aliviar el estrés acumulado, dolores crónicos o rigidez post-ejercicio.",
      basePrice: 17000,
      durationMin: 40,
    },
    {
      id: "3976d400-cf1c-4755-b0b3-974afa3ff84d",
      name: "Masaje Mixto",
      description:
        "Combina lo mejor del masaje descontracturante y relajante. Se focaliza en nudos y puntos de tensión mientras proporciona una sensación general de calma y bienestar.",
      basePrice: 15000,
      durationMin: 40,
    },
    {
      id: "ce66db34-41b9-4d8f-b552-4686e73412a9",
      name: "Masaje de Relajación",
      description:
        "Técnicas suaves y fluidas para promover la calma general del cuerpo y la mente. Incluye aromaterapia para reducir el estrés, mejorar la circulación y equilibrar el sistema nervioso.",
      basePrice: 13000,
      durationMin: 40,
    },
    {
      id: "c5bea80a-6185-40ec-8ed2-c03c4f91030f",
      name: "Masaje Cráneo Facial",
      description:
        "Terapia enfocada en liberar la tensión en la cabeza, sienes, cuello y mandíbula. Ayuda a mitigar dolores de cabeza, migrañas y el bruxismo inducido por el estrés.",
      basePrice: 10000,
      durationMin: 35,
    },
    {
      id: "26817bf8-f439-438e-9a84-7289f7a53f75",
      name: "Masaje Cuerpo Completo",
      description:
        "Tratamiento integral de una hora que abarca desde los pies hasta el cráneo. Ideal para una desconexión profunda y el alivio simultáneo de las tensiones en todas las áreas musculares principales.",
      basePrice: 20000,
      durationMin: 60,
    },
    {
      id: "9b7285f5-a3e0-4eea-951c-86c4d97a92ce",
      name: "Drenaje Linfático",
      description:
        "Técnica manual suave y rítmica que estimula el sistema linfático. Favorece la eliminación de toxinas, reduce la retención de líquidos y mejora la respuesta inmunológica del cuerpo.",
      basePrice: 14000,
      durationMin: 45,
    },
    {
      id: "a60afe19-e99a-498d-9302-8184a55e0a63",
      name: "Masaje Podal",
      description:
        "Terapia concentrada en los pies y pantorrillas. Alivia la fatiga, mejora la circulación en las extremidades inferiores y proporciona un profundo efecto de relajación general del cuerpo.",
      basePrice: 10000,
      durationMin: 30,
    },
    {
      id: "a9db4347-deb1-4065-957c-3fedfd7cbe78",
      name: "Limpieza Facial",
      description:
        "Tratamiento estético completo que purifica la piel, elimina impurezas y células muertas. Incluye hidratación profunda y un masaje facial para un cutis renovado y luminoso.",
      basePrice: 20000,
      durationMin: 60,
    },
  ];

  for (const s of servicios) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {
        // Actualizamos descripción y precio si corres el seed de nuevo
        name: s.name,
        description: s.description,
        basePrice: s.basePrice,
        durationMin: s.durationMin,
      },
      create: {
        id: s.id,
        name: s.name,
        description: s.description,
        basePrice: s.basePrice,
        durationMin: s.durationMin,
        isActive: true,
      },
    });
  }

  // ----------------------------------------------------------------------
  // 2. CLIENTES (Desde patients.txt)
  // ----------------------------------------------------------------------
  console.log("👥 Creando Clientes...");

  const clientes = [
    {
      id: "0vic6sjo1lhksxadts6462",
      fullName: "Juan Alfaro",
      createdAt: 1764869874284,
    },
    {
      id: "4rayvelb1vfti5qk7oyzyl",
      fullName: "Omar Lara",
      createdAt: 1764869884142,
    },
    {
      id: "6c9ukeh2qyx5pysiro66m4",
      fullName: "Matias Poblete",
      createdAt: 1764869899226,
    },
    {
      id: "7sh3avkxila8yekpkxocx3",
      fullName: "Rigoberto Marin",
      createdAt: 1764869772926,
    },
    {
      id: "947a8vbxxy940qxpl3rvyn",
      fullName: "Patoman",
      createdAt: 1764869664331,
    },
    {
      id: "9rrvw3w3k0ckfp88pfjdh",
      fullName: "Aída Espinoza",
      createdAt: 1764869890205,
    },
    {
      id: "a7m9omi0j54254cu1l2r0h",
      fullName: "Bruno",
      createdAt: 1764869860935,
    },
    {
      id: "am7m2wz5v0a5xiocu2sx8x",
      fullName: "Don Luis",
      createdAt: 1764869730689,
    },
    {
      id: "b1stczknxl9s8uomdgl8lh",
      fullName: "Velis",
      createdAt: 1764869803199,
    },
    {
      id: "fjz20k42k0ep39lg3fikgh",
      fullName: "Sebastián Torrealba",
      email: "sebaaignacio111@gmail.com",
      phone: "989095115",
      rut: "19158143-1",
      address: "Newen Antu 962, Padre las Casas, Región de La Araucania",
      createdAt: 1764690132792,
    },
    {
      id: "fuhe1ognmo7ugxjznu9xkh",
      fullName: "Rolando Melo",
      createdAt: 1764869758423,
    },
    {
      id: "jy0ycoygg7ei02fxt505ol",
      fullName: "Patricio Bustamante",
      createdAt: 1764869738358,
    },
    {
      id: "k02vm7abkrta6emfzzmfp",
      fullName: "Rubén Venegas",
      address: "mackena 540",
      createdAt: 1764869710242,
    },
    {
      id: "l35ow7p94lkw0thciauzv",
      fullName: "René Araneda",
      createdAt: 1764869913895,
    },
    {
      id: "l9kz2l4oogx644179hv4m",
      fullName: "Patricio Ulloa",
      createdAt: 1764869745258,
    },
    {
      id: "lhjm04tfa1pmut6imssq5",
      fullName: "Desconocido",
      createdAt: 1764691103759,
    },
    {
      id: "opp2pwm7wjd9swfjrwsuks",
      fullName: "Néstor Medina",
      createdAt: 1764869752742,
    },
    {
      id: "svpvy4v4dnna40nzj1edf4",
      fullName: "Gerardo Donoso",
      createdAt: 1764869842207,
    },
    {
      id: "tajwaa12vtc9uw151bujjk",
      fullName: "Gerardo (abogado)",
      createdAt: 1764869835457,
    },
    {
      id: "tq6yy57q7zfl4vcd767f4",
      fullName: "Cesar Jara",
      createdAt: 1764869782314,
    },
    {
      id: "tz8uneczffbrv3dwo6gpad",
      fullName: "Marco Ruiz",
      createdAt: 1764869852966,
    },
    {
      id: "vd8bce0amyqymma30u4is8",
      fullName: "Don Luis (Javi)",
      createdAt: 1764869819435,
    },
  ];

  for (const c of clientes) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        fullName: c.fullName,
        email: c.email || undefined,
        phone: c.phone || undefined,
        rut: c.rut || undefined,
        address: c.address || undefined,
        createdAt: new Date(c.createdAt),
      },
    });
  }

  // ----------------------------------------------------------------------
  // 3. CITAS (Desde appointments.txt con IDs actualizados)
  // ----------------------------------------------------------------------
  console.log("📅 Creando Citas...");

  const appointments = [
    {
      id: "14811c4b-4db6-4b77-9e93-304ad6cd6978",
      clientId: "fjz20k42k0ep39lg3fikgh",
      start: 1764859800000,
      end: 1764862800000,
      duration: 50,
      total: 30000,
      anamiShare: 18000,
      hotelShare: 12000,
      mode: "hotel",
      services: [] as string[],
    },
    {
      id: "1d078815-4488-497c-bbdf-32a20b2e1fe7",
      clientId: "lhjm04tfa1pmut6imssq5",
      start: 1764791400000,
      end: 1764793800000,
      duration: 40,
      total: 25000,
      anamiShare: 15000,
      hotelShare: 10000,
      mode: "hotel",
      services: [],
    },
    {
      id: "2e3fb321-aa33-4d28-bf19-8dfc0e3ba7be",
      clientId: "lhjm04tfa1pmut6imssq5",
      start: 1764810000000,
      end: 1764812400000,
      duration: 40,
      total: 15000,
      anamiShare: 15000,
      hotelShare: 0,
      mode: "particular",
      // 'mixto' ahora apunta a su UUID real
      services: ["3976d400-cf1c-4755-b0b3-974afa3ff84d"],
    },
    {
      id: "78ac208f-524f-4a60-82d0-5869404c9efb",
      clientId: "lhjm04tfa1pmut6imssq5",
      start: 1764796800000,
      end: 1764799200000,
      duration: 40,
      total: 15000,
      anamiShare: 15000,
      hotelShare: 0,
      mode: "particular",
      // 'mixto' ahora apunta a su UUID real
      services: ["3976d400-cf1c-4755-b0b3-974afa3ff84d"],
    },
    {
      id: "99a4a4a3-1db9-4065-9595-ba57485665aa",
      clientId: "lhjm04tfa1pmut6imssq5",
      start: 1764793800000,
      end: 1764796200000,
      duration: 40,
      total: 17000,
      anamiShare: 17000,
      hotelShare: 0,
      mode: "particular",
      // 'desc' ahora apunta al UUID de Descontracturante
      services: ["41831bfe-bf2b-4a8f-8588-8ffd7741d3bc"],
    },
    {
      id: "b33b6795-ed2c-42d7-bfc4-411b83fff45c",
      clientId: "lhjm04tfa1pmut6imssq5",
      start: 1764790200000,
      end: 1764791400000,
      duration: 20,
      total: 15000,
      anamiShare: 9000,
      hotelShare: 6000,
      mode: "hotel",
      services: [],
    },
    {
      id: "babb45c7-044b-44f1-9470-419eecd4d33a",
      clientId: "fjz20k42k0ep39lg3fikgh",
      start: 1764793800000,
      end: 1764796200000,
      duration: 40,
      total: 17000,
      anamiShare: 17000,
      hotelShare: 0,
      mode: "particular",
      // 'desc' ahora apunta al UUID de Descontracturante
      services: ["41831bfe-bf2b-4a8f-8588-8ffd7741d3bc"],
    },
  ];

  for (const apt of appointments) {
    let locType: LocationType = LocationType.PARTICULAR;
    if (apt.mode === "hotel") {
      locType = LocationType.HOTEL;
    }

    await prisma.appointment.upsert({
      where: { id: apt.id },
      update: {},
      create: {
        id: apt.id,
        clientId: apt.clientId,
        startsAt: new Date(apt.start),
        endsAt: new Date(apt.end),
        durationMinutes: apt.duration,
        totalPrice: apt.total,
        anamiShare: apt.anamiShare,
        hotelShare: apt.hotelShare,
        locationType: locType,
        status: AppointmentStatus.COMPLETED,
        items: {
          create:
            apt.services.length > 0
              ? apt.services.map((svcId) => ({
                  serviceId: svcId,
                  priceAtTime: apt.total,
                }))
              : undefined,
        },
      },
    });
  }

  console.log("✅ Seeding completado exitosamente.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
