import { execSync } from 'node:child_process';
import { PORT } from '../../playwright.config';

export default function globalSetup(): void {
  execSync('pnpm build', { stdio: 'inherit' });
  // astro preview はデーモンとして起動し、すぐ戻る
  execSync(`pnpm exec astro preview --port ${PORT}`, { stdio: 'inherit' });
}
