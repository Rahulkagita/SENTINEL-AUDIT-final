import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  // Token format: mock-jwt-token-{userId}-{timestamp}
  const match = token.match(/mock-jwt-token-([^-]+)/);
  const userId = match ? match[1] : null;

  const user = mockData.getActors().find((a) => a.id === userId);
  if (!user) {
    // Return default first mock user Sarah Chen if token is generic
    const firstActor = mockData.getActors()[0];
    return NextResponse.json({
      id: firstActor.id,
      name: firstActor.name,
      email: firstActor.email,
      role: firstActor.role,
    });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
