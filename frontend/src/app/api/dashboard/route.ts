import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  const metrics = mockData.getDashboardMetrics(workspaceId);
  return NextResponse.json(metrics);
}
