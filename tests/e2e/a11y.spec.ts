import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = [
  'ja/',
  'en/',
  'ja/photos/',
  'en/photos/',
  'ja/photos/kariya-ferris-wheel/',
  'en/photos/kariya-ferris-wheel/',
  'ja/career/',
  'en/career/',
  'does-not-exist/',
];

for (const path of paths) {
  test(`${path} にアクセシビリティ違反が無い`, async ({ page }) => {
    await page.goto(`./${path}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} 件`)).toEqual([]);
  });
}
