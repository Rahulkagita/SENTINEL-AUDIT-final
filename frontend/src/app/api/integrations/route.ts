import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  const { searchParams } = new URL(request.url);
  // `page` is ZERO-based on the wire (see /api/assets route).
  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Number(searchParams.get('pageSize') || '20');

  const data = [...mockData.getIntegrations(workspaceId)];
  const total = data.length;
  const start = page * pageSize;
  const paged = data.slice(start, start + pageSize);

  return NextResponse.json({
    data: paged,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
