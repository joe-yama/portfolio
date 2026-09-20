import type { APIRoute } from 'astro';
import { camera, faviconSvg } from '../lib/pixel';

/** トップのドット絵と同じデータから作る favicon。静的ビルドで dist/favicon.svg に出る */
export const GET: APIRoute = () =>
  new Response(faviconSvg(camera), { headers: { 'Content-Type': 'image/svg+xml' } });
