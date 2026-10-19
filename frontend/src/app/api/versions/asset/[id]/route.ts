import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const assetId = params.id;
  
  // Filter mock audit logs representing changes for this asset
  const assetLogs = mockData.getAuditLogs(workspaceId)
    .filter((log) => log.entityId === assetId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Construct structured version models chronologically
  const chronologicalLogs = [...assetLogs].reverse();
  const versions = chronologicalLogs.map((log, index) => {
    const major = 1 + Math.floor(index / 5);
    const minor = index % 5;
    const versionName = `v${major}.${minor}.0`;
    return {
      versionName,
      log,
    };
  }).reverse(); // Sort back to newest first

  const { searchParams } = new URL(request.url);
  // `page` is ZERO-based on the wire (see /api/assets route).
  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Number(searchParams.get('pageSize') || '100');

  const total = versions.length;
  const start = page * pageSize;
  const paged = versions.slice(start, start + pageSize);

  return NextResponse.json({
    data: paged,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
