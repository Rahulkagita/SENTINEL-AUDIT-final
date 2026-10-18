import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = getWorkspaceId(request);
  const anomaly = mockData.getAnomalies(workspaceId).find((a) => a.id === params.id);
  if (!anomaly) {
    return NextResponse.json({ message: 'Anomaly not found' }, { status: 404 });
  }
  return NextResponse.json(anomaly);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = getWorkspaceId(request);
    const { status } = await request.json();
    const anomalies = mockData.getAnomalies(workspaceId);
    const idx = anomalies.findIndex((a) => a.id === params.id);
    if (idx === -1) {
      return NextResponse.json({ message: 'Anomaly not found' }, { status: 404 });
    }
    
    const anomaly = anomalies[idx];
    const updated = {
      ...anomaly,
      status,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : anomaly.resolvedAt,
    };
    
    anomalies[idx] = updated;
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Update failed' }, { status: 400 });
  }
}
