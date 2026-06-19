const {
  mapWithConcurrency,
  toUploadsPath,
} = require('../../middlewares/upload.middleware');

describe('mapWithConcurrency (pool acotado de galería)', () => {
  test('preserva el orden de entrada aunque terminen desordenados', async () => {
    const delays = [30, 5, 20, 1, 15];
    const out = await mapWithConcurrency(delays, 3, (ms, i) =>
      new Promise((resolve) => setTimeout(() => resolve(i), ms))
    );
    expect(out).toEqual([0, 1, 2, 3, 4]);
  });

  test('nunca supera el límite de tareas en vuelo', async () => {
    const limit = 3;
    let inFlight = 0;
    let peak = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapWithConcurrency(items, limit, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(limit);
    expect(peak).toBeGreaterThan(1); // confirma que SÍ hubo paralelismo
  });

  test('ante un fallo: espera a que los workers en vuelo terminen y propaga el error', async () => {
    const started = [];
    const finished = [];
    const items = Array.from({ length: 8 }, (_, i) => i);

    const run = mapWithConcurrency(items, 3, async (i) => {
      started.push(i);
      await new Promise((r) => setTimeout(r, 5));
      finished.push(i);
      if (i === 1) throw new Error('boom');
      return i;
    });

    await expect(run).rejects.toThrow('boom');
    // Todo lo que arrancó debe haber terminado su escritura (sin trabajo huérfano
    // corriendo tras el rechazo) → cero pérdida/huérfanos en cleanup.
    expect(finished.sort()).toEqual(started.sort());
    // Y tras el fallo NO debe tomar el lote completo (corta trabajo nuevo).
    expect(started.length).toBeLessThan(items.length);
  });

  test('lista vacía → resultado vacío, no cuelga', async () => {
    const out = await mapWithConcurrency([], 3, async (x) => x);
    expect(out).toEqual([]);
  });
});

describe('toUploadsPath (normalización de URL conservada)', () => {
  test('acepta ruta relativa /uploads/', () => {
    expect(toUploadsPath('/uploads/a.webp')).toBe('/uploads/a.webp');
  });

  test('extrae pathname de URL absoluta del proxy', () => {
    expect(toUploadsPath('https://service.example.cloud/uploads/a.webp')).toBe('/uploads/a.webp');
  });

  test('normaliza prefijo proxy /api/uploads/ del front', () => {
    expect(toUploadsPath('/api/uploads/a.webp')).toBe('/uploads/a.webp');
    expect(toUploadsPath('https://service.example.cloud/api/uploads/a.webp')).toBe('/uploads/a.webp');
  });

  test('rechaza rutas fuera de /uploads/ (anti path-traversal/SSRF)', () => {
    expect(toUploadsPath('/etc/passwd')).toBeNull();
    expect(toUploadsPath('https://evil.com/x.webp')).toBeNull();
    expect(toUploadsPath('')).toBeNull();
    expect(toUploadsPath(undefined)).toBeNull();
    expect(toUploadsPath('not a url')).toBeNull();
  });
});
