import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';
import type { AuditLogEntry } from '@/types';

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Number(searchParams.get('pageSize') || '20');
  const sort = searchParams.get('sort');
  const orderParam = searchParams.get('order') || 'desc';

  let data = [...mockData.getAuditLogs(workspaceId)];
  if (search) {
    data = data.filter(
      (log) =>
        log.entityName.toLowerCase().includes(search) ||
        log.actor.name.toLowerCase().includes(search) ||
        log.operation.toLowerCase().includes(search),
    );
  }

  if (sort) {
    const sortKey = sort as keyof AuditLogEntry;
    const order = orderParam === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * order;
      }
      return 0;
    });
  } else {
    data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const total = data.length;
  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  return NextResponse.json({
    data: paged,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
