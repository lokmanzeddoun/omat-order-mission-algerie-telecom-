import pino from 'pino';
import { Writable } from 'stream';
import { REDACTED_PATHS } from './logger';

function capture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  const logger = pino(
    { redact: { paths: REDACTED_PATHS, censor: '[redacted]' } },
    stream,
  );
  return { logger, output: () => lines.join('') };
}

describe('log redaction', () => {
  it('hides the bearer token, the cookies and passwords', () => {
    const { logger, output } = capture();
    logger.info({
      req: {
        headers: {
          authorization: 'Bearer eyJhbGciOi.secret.sig',
          cookie: 'refresh_token=abc123',
        },
      },
      res: { headers: { 'set-cookie': 'refresh_token=def456' } },
      body: { password: 'hunter2', newPassword: 'n3w-secret' },
      token: 'raw-token',
    });
    const out = output();
    for (const secret of [
      'eyJhbGciOi',
      'abc123',
      'def456',
      'hunter2',
      'n3w-secret',
      'raw-token',
    ]) {
      expect(out).not.toContain(secret);
    }
    expect(out).toContain('[redacted]');
  });
});
