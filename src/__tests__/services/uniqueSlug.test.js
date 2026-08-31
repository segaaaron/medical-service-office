const { createWithUniqueSlug, MAX_SLUG_ATTEMPTS } = require('../../services/uniqueSlug.service');

function p2002(target = ['slug']) {
  return Object.assign(new Error('Unique constraint failed'), { code: 'P2002', meta: { target } });
}

describe('uniqueSlug.service', () => {
  describe('createWithUniqueSlug', () => {
    it('uses the base slug when it is free', async () => {
      const run = jest.fn().mockResolvedValue({ id: '1' });
      const result = await createWithUniqueSlug('mi-post', run);
      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith('mi-post');
      expect(result).toEqual({ id: '1' });
    });

    it('appends -2 on the first slug collision', async () => {
      const run = jest.fn()
        .mockRejectedValueOnce(p2002())
        .mockResolvedValue({ id: '2' });
      const result = await createWithUniqueSlug('mi-post', run);
      expect(run.mock.calls.map((c) => c[0])).toEqual(['mi-post', 'mi-post-2']);
      expect(result).toEqual({ id: '2' });
    });

    it('keeps counting on repeated collisions', async () => {
      const run = jest.fn()
        .mockRejectedValueOnce(p2002())
        .mockRejectedValueOnce(p2002())
        .mockResolvedValue({ id: '3' });
      await createWithUniqueSlug('mi-post', run);
      expect(run.mock.calls.map((c) => c[0])).toEqual(['mi-post', 'mi-post-2', 'mi-post-3']);
    });

    it('falls back to a random suffix once the counter keeps racing', async () => {
      const run = jest.fn()
        .mockRejectedValueOnce(p2002())
        .mockRejectedValueOnce(p2002())
        .mockRejectedValueOnce(p2002())
        .mockResolvedValue({ id: '4' });
      await createWithUniqueSlug('mi-post', run);
      const slugs = run.mock.calls.map((c) => c[0]);
      expect(slugs.slice(0, 3)).toEqual(['mi-post', 'mi-post-2', 'mi-post-3']);
      expect(slugs[3]).toMatch(/^mi-post-[0-9a-f]{6}$/);
    });

    it('rethrows a P2002 that is not about the slug', async () => {
      const err = p2002(['email']);
      const run = jest.fn().mockRejectedValue(err);
      await expect(createWithUniqueSlug('mi-post', run)).rejects.toBe(err);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('rethrows any non-P2002 error immediately', async () => {
      const err = new Error('boom');
      const run = jest.fn().mockRejectedValue(err);
      await expect(createWithUniqueSlug('mi-post', run)).rejects.toBe(err);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('gives up after MAX_SLUG_ATTEMPTS instead of looping forever', async () => {
      const run = jest.fn().mockRejectedValue(p2002());
      await expect(createWithUniqueSlug('mi-post', run)).rejects.toMatchObject({ code: 'P2002' });
      expect(run).toHaveBeenCalledTimes(MAX_SLUG_ATTEMPTS);
    });
  });
});
