import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const integration = mockData.getIntegrations(workspaceId).find((i) => i.id === params.id);
  if (!integration) {
    return NextResponse.json({ message: 'Integration not found' }, { status: 404 });
  }
  return NextResponse.json(integration);
}
