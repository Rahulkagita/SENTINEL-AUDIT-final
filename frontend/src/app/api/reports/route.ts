import { NextResponse } from 'next/server';

const mockReports = [
  {
    id: 'rep-1',
    name: 'Q2 Compliance Integrity Audit',
    status: 'ready',
    reportType: 'compliance',
    downloadUrl: '#',
    createdAt: '2026-07-10T14:22:00Z',
  },
  {
    id: 'rep-2',
    name: 'July System Anomalies Log',
    status: 'ready',
    reportType: 'security',
    downloadUrl: '#',
    createdAt: '2026-07-15T09:12:00Z',
  },
];

export async function GET() {
  return NextResponse.json(mockReports);
}

export async function POST(request: Request) {
  try {
    const { reportType, format } = await request.json();
    const newReport = {
      id: `rep-${Date.now()}`,
      name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Audit Report (${format.toUpperCase()})`,
      status: 'ready',
      reportType,
      downloadUrl: '#',
      createdAt: new Date().toISOString(),
    };
    mockReports.push(newReport);
    return NextResponse.json(newReport, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Generate failed' }, { status: 400 });
  }
}
