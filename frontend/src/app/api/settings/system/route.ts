import { NextResponse } from 'next/server';

let systemSettings = {
  mfaEnabled: true,
  tamperAlertsEnabled: true,
  retentionPeriodDays: 90,
  apiAccessAllowed: true,
};

export async function GET() {
  return NextResponse.json(systemSettings);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    systemSettings = { ...systemSettings, ...body };
    return NextResponse.json(systemSettings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Update failed' }, { status: 400 });
  }
}
