import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_NAME } from '@/lib/constants';

/**
 * Guard rails for the mock-to-backend refactor.
 *
 * These tests pin the structural facts of the cleanup so a future change
 * cannot silently reintroduce:
 *  1. the Next.js mock API route handlers under src/app/api (they would
 *     shadow the /api proxy rewrite in next.config.js and serve fake data),
 *  2. imports of deleted mock/workspace/anomaly/integration modules,
 *  3. the removed X-Workspace-Id header,
 *  4. fake product naming ("SentinelAudit AI" — no AI exists).
 *
 * They run against the real file system on purpose: the absence of files is
 * the behaviour under test.
 */

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(srcDir, '..');

function existsInSrc(relativePath: string): boolean {
  return fs.existsSync(path.join(srcDir, relativePath));
}

/** Every .ts/.tsx file under src/ (excluding node_modules). */
function walkSources(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSources(full, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const MOCK_REMOVED_PATHS = [
  'app/api', // mock route handlers (would shadow the backend proxy)
  'services/mock-data.ts',
  'lib/api-helper.ts',
  'providers/workspace-provider.tsx',
  'hooks/use-workspace.ts',
  'components/layout/workspace-switcher.tsx',
  'hooks/use-anomalies.ts',
  'hooks/use-integrations.ts',
  'services/analytics.ts',
  'services/integration.service.ts',
  'services/reports.ts',
  'services/settings.ts',
  'features/anomalies',
  'features/integrations',
  'app/anomalies',
  'app/integrations',
  'components/marketing',
  'content',
];

const DELETED_MODULE_MARKERS = [
  '@/providers/workspace-provider',
  '@/hooks/use-workspace',
  '@/components/layout/workspace-switcher',
  '@/hooks/use-anomalies',
  '@/hooks/use-integrations',
  '@/services/mock-data',
  '@/lib/api-helper',
  '@/services/analytics',
  '@/services/integration.service',
  '@/services/reports',
  '@/services/settings',
  '@/content/marketing',
  '@/components/marketing',
];

describe('mock layer stays removed', () => {
  it.each(MOCK_REMOVED_PATHS)('src/%s does not exist', (relativePath) => {
    expect(existsInSrc(relativePath)).toBe(false);
  });

  it('no source file imports a deleted mock/workspace/anomaly/integration module', () => {
    const offenders = walkSources(srcDir)
      .filter((file) => !/\.test\.tsx?$/.test(file)) // skip this guard's own marker list
      .filter((file) => {
      const contents = fs.readFileSync(file, 'utf8');
      return DELETED_MODULE_MARKERS.some((marker) => contents.includes(marker));
    });
    expect(offenders.map((f) => path.relative(frontendRoot, f))).toEqual([]);
  });
});

describe('backend wiring (proxy, not mocks)', () => {
  const nextConfig = fs.readFileSync(path.join(frontendRoot, 'next.config.js'), 'utf8');
  const envSource = fs.readFileSync(path.join(srcDir, 'lib/env.ts'), 'utf8');
  const httpClientSource = fs.readFileSync(path.join(srcDir, 'services/http-client.ts'), 'utf8');

  it('next.config.js proxies /api/* to the Spring Boot backend', () => {
    expect(nextConfig).toContain("source: '/api/:path*'");
    expect(nextConfig).toContain('/api/:path*');
    expect(nextConfig).toContain('API_PROXY_TARGET');
    // The proxy target must be the backend, never a local route handler.
    expect(nextConfig).toContain('http://localhost:8080');
  });

  it('api base URL defaults to same-origin /api (the proxy entry point)', () => {
    expect(envSource).toContain('"/api"');
    expect(envSource).toContain('NEXT_PUBLIC_API_BASE_URL');
    // Supabase config was never used — it must not come back silently.
    expect(envSource).not.toContain('SUPABASE');
  });

  it('http client sends the JWT only — no X-Workspace-Id header', () => {
    expect(httpClientSource).not.toContain('X-Workspace-Id');
    expect(httpClientSource).not.toContain('sentinel_active_workspace');
    expect(httpClientSource).toContain('Authorization');
    expect(httpClientSource).toContain('sentinel_audit_token');
  });
});

describe('honest product naming', () => {
  it('APP_NAME has no fabricated AI suffix', () => {
    expect(APP_NAME).toBe('SentinelAudit');
    expect(APP_NAME).not.toContain('AI');
  });

  it('constants make no tamper-evident / AI claims', () => {
    const constantsSource = fs.readFileSync(path.join(srcDir, 'lib/constants.ts'), 'utf8');
    expect(constantsSource).not.toMatch(/tamper-evident|AI-assisted|AI-powered|cryptograph/i);
  });
});
