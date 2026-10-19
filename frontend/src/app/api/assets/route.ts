import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';
import type { Entity } from '@/types';

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  // `page` is ZERO-based on the wire: the service layer converts the UI's
  // one-based page (1 -> 0) with toApiPage(), matching the Spring Data
  // contract used by the real backend.
  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Number(searchParams.get('pageSize') || '20');

  let data = [...mockData.getEntities(workspaceId)];
  if (search) {
    data = data.filter(
      (e) =>
        e.displayName.toLowerCase().includes(search) ||
        e.name.toLowerCase().includes(search) ||
        e.sourceApplication.toLowerCase().includes(search),
    );
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

export async function POST(request: Request) {
  try {
    const workspaceId = getWorkspaceId(request);
    const body = await request.json();
    
    const newEntity: Entity = {
      ...body,
      id: `e-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastChangedAt: new Date().toISOString(),
      changeCount: 0,
      recordCount: 0,
    };
    
    mockData.getEntities(workspaceId).push(newEntity);
    return NextResponse.json(newEntity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Create failed' }, { status: 400 });
  }
}
