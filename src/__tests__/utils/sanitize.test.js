const { sanitizePayload, isSensitiveKey, REDACTED } = require('../../utils/sanitize');

describe('sanitize', () => {
  describe('isSensitiveKey', () => {
    it('detects sensitive keys case/format-insensitive', () => {
      ['password', 'Password', 'PASS_WORD', 'accessToken', 'refresh_token',
       'email', 'correo', 'phone', 'telefono', 'dni', 'patientName',
       'patient_lastname', 'authorization'].forEach((k) => {
        expect(isSensitiveKey(k)).toBe(true);
      });
    });

    it('leaves non-sensitive keys alone', () => {
      ['id', 'status', 'rating', 'slug', 'order', 'count'].forEach((k) => {
        expect(isSensitiveKey(k)).toBe(false);
      });
    });
  });

  describe('sanitizePayload', () => {
    it('redacts sensitive values but keeps structure', () => {
      const out = sanitizePayload({
        email: 'paciente@mail.com',
        password: 'secret123',
        treatmentId: 'tid-1',
        rating: 5,
        nested: { token: 'abc', note: 'ok' },
      });
      expect(out.email).toBe(REDACTED);
      expect(out.password).toBe(REDACTED);
      expect(out.treatmentId).toBe('tid-1');
      expect(out.rating).toBe(5);
      expect(out.nested.token).toBe(REDACTED);
      expect(out.nested.note).toBe('ok');
    });

    it('returns null for empty/nullish payloads', () => {
      expect(sanitizePayload(null)).toBeNull();
      expect(sanitizePayload(undefined)).toBeNull();
      expect(sanitizePayload({})).toBeNull();
      expect(sanitizePayload([])).toBeNull();
    });

    it('truncates very long strings', () => {
      const out = sanitizePayload({ note: 'x'.repeat(5000) });
      expect(out.note.length).toBeLessThan(5000);
      expect(out.note.endsWith('…[TRUNCATED]')).toBe(true);
    });

    it('caps deep nesting without throwing', () => {
      let deep = { v: 1 };
      for (let i = 0; i < 20; i++) deep = { child: deep };
      expect(() => sanitizePayload(deep)).not.toThrow();
    });

    it('caps large arrays', () => {
      const out = sanitizePayload({ items: Array.from({ length: 200 }, (_, i) => i) });
      expect(out.items.length).toBeLessThanOrEqual(51);
    });

    it('redacts sensitive keys inside arrays of objects', () => {
      const out = sanitizePayload({ users: [{ email: 'a@b.com', id: 1 }] });
      expect(out.users[0].email).toBe(REDACTED);
      expect(out.users[0].id).toBe(1);
    });
  });
});
