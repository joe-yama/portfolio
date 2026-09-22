import { expect, test } from '@playwright/test';
import { paths } from './paths';

for (const path of paths) {
  test(`${path} は外部ホストへ要求しない`, async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') external.push(request.url());
    });
    await page.goto(`./${path}`, { waitUntil: 'networkidle' });
    expect(external).toEqual([]);
  });
}
