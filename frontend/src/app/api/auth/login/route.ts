import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import type { Actor } from '@/types';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    // Find matching user from mock actors
    let user = mockData.getActors().find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // If not configured, create a custom dynamic user
      const name = email.split('@')[0] || 'User';
      user = {
        id: `u-custom-${Date.now()}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email.toLowerCase(),
        role: 'Data Steward',
      };
      mockData.getActors().push(user);
    }
    
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
