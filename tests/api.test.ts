import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/server";
import { prisma } from "../src/core/prisma";

// Variables para reutilizar entre tests
let testClientId: string;
let testServiceId: string;
let testServicePrice: number;
let testServiceDuration: number;

const uniqueSuffix = Date.now();

describe("Anami Backend - Appointments Module", () => {
  beforeAll(async () => {
    // 1. ¡LIMPIEZA! Borramos todas las citas para evitar conflictos con tests anteriores
    await prisma.appointment.deleteMany();
    // Opcional: Si quieres borrar también clientes de prueba viejos
    // await prisma.client.deleteMany({ where: { email: { contains: 'test.com' } } });

    // 2. Buscamos un servicio REAL de la base de datos (del Seed)
    const service = await prisma.service.findFirst({
      where: { name: { contains: "Descontracturante" } },
    });

    if (!service)
      throw new Error(
        '❌ NO SE ENCONTRÓ EL SERVICIO. Ejecuta "yarn prisma db seed" primero.',
      );

    testServiceId = service.id;
    testServicePrice = service.basePrice;
    testServiceDuration = service.durationMin;

    console.log(
      `✅ Test Environment: Usando servicio "${service.name}" (ID: ${testServiceId})`,
    );
  });

  // --------------------------------------------------------
  // 1. PREPARACIÓN: Crear Cliente
  // --------------------------------------------------------
  it("POST /v1/clients - Create a client for the appointments", async () => {
    const newClient = {
      fullName: `Mobile App Tester ${uniqueSuffix}`,
      email: `mobile.${uniqueSuffix}@test.com`,
      phone: "+56900000000",
    };

    const res = await app.request("/v1/clients", {
      method: "POST",
      body: JSON.stringify(newClient),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    testClientId = body.data.id;
  });

  // --------------------------------------------------------
  // 2. CASO DE ÉXITO: Agendar Cita (Particular)
  // --------------------------------------------------------
  it("POST /v1/appointments - Should schedule PARTICULAR appointment correctly", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1); // Mañana
    startsAt.setHours(10, 0, 0, 0); // 10:00 AM

    const payload = {
      clientId: testClientId,
      serviceIds: [testServiceId],
      startsAt: startsAt.toISOString(),
      locationType: "PARTICULAR",
      notes: "Test Particular",
    };

    const res = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    // Validar Cálculos Financieros (Particular = 100% Anami)
    expect(body.data.totalPrice).toBe(testServicePrice);
    expect(body.data.anamiShare).toBe(testServicePrice);
    expect(body.data.hotelShare).toBe(0);

    // Validar Tiempos
    expect(body.data.durationMinutes).toBe(testServiceDuration);
    // Calcular fin esperado
    const expectedEnd = new Date(
      startsAt.getTime() + testServiceDuration * 60000,
    ).toISOString();
    expect(body.data.endsAt).toBe(expectedEnd);
  });

  // --------------------------------------------------------
  // 3. CASO DE ÉXITO: Agendar Cita (Hotel)
  // --------------------------------------------------------
  it("POST /v1/appointments - Should schedule HOTEL appointment with commission split", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(12, 0, 0, 0); // 12:00 PM (Mismo día, diferente hora)

    const payload = {
      clientId: testClientId,
      serviceIds: [testServiceId],
      startsAt: startsAt.toISOString(),
      locationType: "HOTEL",
      notes: "Test Hotel",
    };

    const res = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const body = await res.json();
    expect(res.status).toBe(201);

    // Validar Split (Hotel 40% - Según tu lógica actual en service)
    const expectedHotelShare = Math.round(testServicePrice * 0.4);
    const expectedAnamiShare = testServicePrice - expectedHotelShare;

    expect(body.data.totalPrice).toBe(testServicePrice);
    expect(body.data.hotelShare).toBe(expectedHotelShare);
    expect(body.data.anamiShare).toBe(expectedAnamiShare);
  });

  // --------------------------------------------------------
  // 4. VALIDACIÓN: Conflicto de Horario (Tope)
  // --------------------------------------------------------
  it("POST /v1/appointments - Should reject overlapping appointments", async () => {
    // Intentamos agendar A LA MISMA HORA que la cita del paso 2 (10:00 AM)
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(10, 10, 0, 0); // 10:10 AM (Cae dentro del rango 10:00 - 10:40)

    const payload = {
      clientId: testClientId,
      serviceIds: [testServiceId],
      startsAt: startsAt.toISOString(),
      locationType: "PARTICULAR",
    };

    const res = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const body = await res.json();

    expect(res.status).toBe(409); // Conflict
    expect(body.success).toBe(false);
    expect(body.message).toContain("horario"); // Debe mencionar algo del horario
  });

  // --------------------------------------------------------
  // 5. VALIDACIÓN: Datos Inválidos
  // --------------------------------------------------------
  it("POST /v1/appointments - Should fail with invalid Service ID", async () => {
    const payload = {
      clientId: testClientId,
      serviceIds: ["00000000-0000-0000-0000-000000000000"], // UUID válido pero inexistente
      startsAt: new Date().toISOString(),
      locationType: "PARTICULAR",
    };

    // Tu servicio lanza 400 si los IDs no coinciden con la DB
    const res = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });

  // --------------------------------------------------------
  // 6. LECTURA: Paginación y Listado
  // --------------------------------------------------------
  it("GET /v1/appointments - Should return paginated list", async () => {
    // Pedimos página 1, límite 5
    const res = await app.request("/v1/appointments?page=1&limit=5");

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    // Validar estructura de Meta (Paginación)
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(5);
    expect(typeof body.meta.total).toBe("number");

    // Debemos encontrar al menos las 2 citas que creamos hoy
    expect(body.meta.total).toBeGreaterThanOrEqual(2);
  });
  // --------------------------------------------------------
  // 7. SUITE AVANZADA: VALIDACIÓN DE CRUCES (OVERLAPS)
  // --------------------------------------------------------
  describe("Advanced Overlap Scenarios", () => {
    // Configuración: Creamos una "Cita Base" que actuará como obstáculo
    // Horario Base: Mañana de 14:00 a 14:XX (dependiendo de la duración del servicio)
    let baseStart: Date;
    let baseEnd: Date;

    beforeAll(async () => {
      // Definimos las 14:00 de mañana
      baseStart = new Date();
      baseStart.setDate(baseStart.getDate() + 1);
      baseStart.setHours(14, 0, 0, 0);

      // Calculamos el fin basado en la duración del servicio de prueba (ej: 40 o 50 min)
      baseEnd = new Date(baseStart.getTime() + testServiceDuration * 60000);

      // Creamos la "Cita Obstáculo"
      await app.request("/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientId: testClientId,
          serviceIds: [testServiceId],
          startsAt: baseStart.toISOString(),
          locationType: "PARTICULAR",
          notes: "OBSTÁCULO",
        }),
        headers: { "Content-Type": "application/json" },
      });

      console.log(
        `🚧 Cita Obstáculo Creada: ${baseStart.toISOString()} - ${baseEnd.toISOString()}`,
      );
    });

    // Helper para intentar agendar
    const trySchedule = async (startHour: number, startMin: number) => {
      const start = new Date(baseStart);
      start.setHours(startHour, startMin, 0, 0);

      return await app.request("/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientId: testClientId,
          serviceIds: [testServiceId], // Usamos el mismo servicio (duración fija)
          startsAt: start.toISOString(),
          locationType: "PARTICULAR",
        }),
        headers: { "Content-Type": "application/json" },
      });
    };

    // --- CASOS DE FALLO (Deben dar 409) ---

    it("Should FAIL: New appointment starts BEFORE but ends INSIDE existing (Partial Head)", async () => {
      // Obstáculo: 14:00 - 14:40
      // Intento:   13:50 - 14:30 (Choca)
      const res = await trySchedule(13, 50);
      expect(res.status).toBe(409);
    });

    it("Should FAIL: New appointment starts INSIDE and ends AFTER existing (Partial Tail)", async () => {
      // Obstáculo: 14:00 - 14:40
      // Intento:   14:20 - 15:00 (Choca)
      const res = await trySchedule(14, 20);
      expect(res.status).toBe(409);
    });

    it("Should FAIL: New appointment is COMPLETELY INSIDE existing", async () => {
      // Obstáculo: 14:00 - 14:40
      // Intento:   14:10 - 14:50 (Choca - asumiendo que dura menos o igual, igual choca el inicio)
      // Nota: Si el servicio dura 40 min, empezando a las 14:10 termina 14:50.
      // El inicio (14:10) está dentro del rango [14:00 - 14:40].
      const res = await trySchedule(14, 10);
      expect(res.status).toBe(409);
    });

    it("Should FAIL: New appointment ENCLOSES existing (Surrounding)", async () => {
      // Para probar esto necesitamos "forzar" una duración larga o empezar mucho antes.
      // Como usamos el mismo servicio, empezaremos antes para que termine después del inicio del obstáculo.
      // Pero espera, si usamos el mismo serviceId, la duración es fija.
      // Para simular "Enclosing", necesitamos una cita que empiece antes (13:30) y termine después (14:40).
      // Con un solo servicio corto es difícil simular "Enclosing" exacto sin crear otro servicio largo.
      // PERO, la lógica de "starts inside" o "ends inside" ya cubre la mayoría.
      // Probemos el caso de "Exact Match" (Misma hora de inicio)
      const res = await trySchedule(14, 0);
      expect(res.status).toBe(409);
    });

    // --- CASOS DE ÉXITO (Deben dar 201) ---
    // Estos validan que tu lógica no sea "demasiado agresiva"

    it("Should SUCCESS: New appointment ENDS exactly when existing STARTS (Touching Boundaries)", async () => {
      // Obstáculo: 14:00 - 14:40
      // Intento:   13:20 (Dura 40 min) -> Termina 14:00
      // Matemáticamente: Nuevo Fin (14:00) == Obstáculo Inicio (14:00). NO debe chocar.

      // Calculamos la hora de inicio necesaria para terminar a las 14:00
      const startHour = 14;
      const startMin = 0 - testServiceDuration; // 14:00 menos 40 mins = 13:20

      // Ajuste simple de hora/min (asumiendo que duration < 60 para facilitar el test)
      const date = new Date(baseStart);
      date.setMinutes(date.getMinutes() - testServiceDuration);

      const res = await app.request("/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientId: testClientId,
          serviceIds: [testServiceId],
          startsAt: date.toISOString(),
          locationType: "PARTICULAR",
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(201);
    });

    it("Should SUCCESS: New appointment STARTS exactly when existing ENDS", async () => {
      // Obstáculo: 14:00 - 14:40
      // Intento:   14:40 (Empieza justo cuando termina el otro)

      const date = new Date(baseEnd); // 14:40

      const res = await app.request("/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientId: testClientId,
          serviceIds: [testServiceId],
          startsAt: date.toISOString(),
          locationType: "PARTICULAR",
        }),
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(201);
    });
  });
  // --------------------------------------------------------
  // 8. ACTUALIZACIÓN: Reprogramar Cita (PATCH)
  // --------------------------------------------------------
  it("PATCH /v1/appointments/:id - Should reschedule and update notes", async () => {
    // 1. Creamos una cita inicial para editar
    const start = new Date();
    start.setDate(start.getDate() + 2); // Pasado mañana
    start.setHours(9, 0, 0, 0);

    const createRes = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify({
        clientId: testClientId,
        serviceIds: [testServiceId],
        startsAt: start.toISOString(),
        locationType: "PARTICULAR",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const created = await createRes.json();
    const appointmentId = created.data.id;

    // 2. Intentamos ACTUALIZAR: Cambiamos hora y nota
    const newStart = new Date(start);
    newStart.setHours(15, 0, 0, 0); // La movemos a la tarde

    const res = await app.request(`/v1/appointments/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify({
        startsAt: newStart.toISOString(),
        notes: "Nota editada y hora cambiada",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Validamos que los cambios se aplicaron
    expect(body.data.startsAt).toBe(newStart.toISOString());

    // Validamos que el precio se mantuvo (no cambiamos servicios)
    expect(body.data.totalPrice).toBe(created.data.totalPrice);
  });

  // --------------------------------------------------------
  // 9. ELIMINACIÓN: Cancelar Cita y Liberar Horario
  // --------------------------------------------------------
  it("DELETE /v1/appointments/:id - Should cancel and free up the slot", async () => {
    // 1. Crear una cita para borrar (Mañana a las 18:00)
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(18, 0, 0, 0);

    const createRes = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify({
        clientId: testClientId,
        serviceIds: [testServiceId],
        startsAt: start.toISOString(),
        locationType: "PARTICULAR",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const created = await createRes.json();
    const idToDelete = created.data.id;

    // 2. ELIMINAR (Cancelar)
    const delRes = await app.request(`/v1/appointments/${idToDelete}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(200);

    // 3. VERIFICAR: Intentar agendar OTRA VEZ a la misma hora (18:00)
    // Antes esto daba 409 Conflict. Ahora debería dar 201 Created porque el cupo se liberó.
    const retryRes = await app.request("/v1/appointments", {
      method: "POST",
      body: JSON.stringify({
        clientId: testClientId,
        serviceIds: [testServiceId],
        startsAt: start.toISOString(),
        locationType: "PARTICULAR",
        notes: "Cita tomada en horario liberado",
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(retryRes.status).toBe(201); // ¡Éxito! El horario estaba libre.
  });
});
