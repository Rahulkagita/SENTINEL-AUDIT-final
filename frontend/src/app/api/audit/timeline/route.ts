import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  const { searchParams } = new URL(request.url);

  // `page` is ZERO-based on the wire: the service layer converts the UI's
  // one-based page (1 -> 0) with toApiPage(), matching the Spring Data
  // contract used by the real backend.
  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Number(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search')?.toLowerCase();
  const operation = searchParams.get('operation')?.toUpperCase();

  let data = [...mockData.getTimelineEvents(workspaceId)].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );

  // Real filters, applied before pagination so `total` reflects the filtered
  // result set - the UI must be able to distinguish "no matches" from
  // "not loaded".
  if (search) {
    data = data.filter(
      (event) =>
        event.entityName.toLowerCase().includes(search) ||
        event.actor.name.toLowerCase().includes(search) ||
        event.summary.toLowerCase().includes(search),
    );
  }
  if (operation) {
    data = data.filter((event) => event.operation.toUpperCase() === operation);
  }

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
