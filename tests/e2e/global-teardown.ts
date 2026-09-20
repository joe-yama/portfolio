import { execSync } from 'node:child_process';

export default function globalTeardown(): void {
  execSync('pnpm exec astro preview stop', { stdio: 'inherit' });
}
