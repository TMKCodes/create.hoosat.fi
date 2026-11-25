import { sanitizeUrlPath } from '../server/core/server';
import { safeFilename } from '../server/core/upload';

describe('sanitizeUrlPath', () => {
  it('keeps normal URL paths intact on every OS', () => {
    expect(sanitizeUrlPath('/')).toBe('/');
    expect(sanitizeUrlPath('/api/ping/5')).toBe('/api/ping/5');
    expect(sanitizeUrlPath('/public/styles.css')).toBe('/public/styles.css');
  });

  it('keeps the query string separate from the path', () => {
    expect(sanitizeUrlPath('/about?lang=fi')).toBe('/about?lang=fi');
  });

  it('resolves dot segments without escaping the root', () => {
    expect(sanitizeUrlPath('/a/./b/../c')).toBe('/a/c');
    expect(sanitizeUrlPath('/../../etc/passwd')).toBe('/etc/passwd');
  });

  it('rejects encoded traversal sequences', () => {
    expect(() => sanitizeUrlPath('/a/..%2f..%2fetc/passwd')).toThrow();
    expect(() => sanitizeUrlPath('/..\\..\\windows\\win.ini')).toThrow();
  });
});

describe('safeFilename', () => {
  it('strips directory parts from client supplied file names', () => {
    expect(safeFilename('../../build/server.js')).toBe('server.js');
    expect(safeFilename('..\\..\\build\\server.js')).toBe('server.js');
    expect(safeFilename('/etc/passwd')).toBe('passwd');
  });

  it('replaces unsafe characters and never returns an empty or hidden name', () => {
    expect(safeFilename('my photo (1).png')).toBe('my_photo__1_.png');
    expect(safeFilename('.htaccess')).toBe('htaccess');
    expect(safeFilename('..')).toBe('file');
    expect(safeFilename(undefined)).toBe('file');
  });
});
