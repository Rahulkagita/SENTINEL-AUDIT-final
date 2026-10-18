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

  return NextResponse.json({
    data: versions,
    total: versions.length,
    page: 1,
    pageSize: 100,
    totalPages: 1,
  });
}
