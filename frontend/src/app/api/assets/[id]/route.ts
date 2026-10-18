import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const entity = mockData.getEntities(workspaceId).find((e) => e.id === params.id);
  if (!entity) {
    return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
  }
  return NextResponse.json(entity);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = getWorkspaceId(request);
    const body = await request.json();
    const entities = mockData.getEntities(workspaceId);
    const idx = entities.findIndex((e) => e.id === params.id);
    if (idx === -1) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
    
    const updated = {
      ...entities[idx],
      ...body,
      lastChangedAt: new Date().toISOString(),
    };
    
    entities[idx] = updated;
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const entities = mockData.getEntities(workspaceId);
  const idx = entities.findIndex((e) => e.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
  }
  entities.splice(idx, 1);
  return new Response(null, { status: 204 });
}
