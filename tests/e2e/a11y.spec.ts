import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectedStatus, paths } from './paths';

for (const path of paths) {
  test(`${path} にアクセシビリティ違反が無い`, async ({ page }) => {
    // 404 ページを検査して緑になる（検査したつもりのページが存在しない）ことを防ぐ
    const response = await page.goto(`./${path}`);
    expect(response?.status()).toBe(expectedStatus(path));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} 件`)).toEqual([]);
  });
}
