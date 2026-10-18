import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import { getWorkspaceId } from '@/lib/api-helper';
import type { AuditLogEntry } from '@/types';

export async function POST(request: Request) {
  try {
    const workspaceId = getWorkspaceId(request);
    const { assetId, versionName } = await request.json();
    
    // Find the asset to verify it exists
    const entities = mockData.getEntities(workspaceId);
    const asset = entities.find((a) => a.id === assetId);
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
    
    // Build a snapshot record from the asset schema
    const snapshot: Record<string, unknown> = {};
    if (asset.schema) {
      asset.schema.forEach((field) => {
        snapshot[field.key] = `mock-${field.type}-value`;
      });
    }

    const auditLogs = mockData.getAuditLogs(workspaceId);

    // Create a real RESTORE audit log entry to append to mockData.getAuditLogs
    const newLog: AuditLogEntry = {
      id: `c-a-restore-${Date.now()}`,
      entityId: assetId,
      entityName: asset.displayName,
      operation: 'RESTORE',
      severity: 'warning',
      status: 'verified',
      actor: mockData.getActors()[0],
      sourceApplication: 'Sentinel Console',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      reason: `Rolled back configurations to version ${versionName}`,
      fieldChanges: [],
      beforeSnapshot: snapshot,
      afterSnapshot: snapshot,
      hash: Math.random().toString(36).substring(2, 15),
      previousHash: auditLogs[0]?.hash || 'root',
      createdAt: new Date().toISOString(),
    };
    
    // Insert at front of mock ledger
    auditLogs.unshift(newLog);
    
    return NextResponse.json({
      success: true,
      message: `Asset successfully rolled back to version ${versionName}!`,
      restoredVersion: {
        versionName,
        log: newLog,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Request failed' }, { status: 400 });
  }
}
