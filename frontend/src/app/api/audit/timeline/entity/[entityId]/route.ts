import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(
  request: Request,
  { params }: { params: { entityId: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const events = mockData.getTimelineEvents(workspaceId)
    .filter((e) => e.entityId === params.entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    
  return NextResponse.json(events);
}
