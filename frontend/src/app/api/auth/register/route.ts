import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import type { Actor } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json();
    
    const user: Actor = {
      id: `u-reg-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
    };
    
    mockData.getActors().push(user);
    
    const accessToken = `mock-jwt-token-${user.id}-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${user.id}-${Date.now()}`;
    
    return NextResponse.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Request failed' }, { status: 400 });
  }
}
