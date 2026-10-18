import { NextResponse } from 'next/server';
import { mockData } from '@/services/mock-data';
import type { Actor } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  
  try {
    if (path === 'logout') {
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }
    
    if (path === 'oauth') {
      const { provider } = await request.json();
      const actors = mockData.getActors();
      const randomUser = actors[Math.floor(Math.random() * actors.length)];
      const oauthUser: Actor = {
        ...randomUser,
        id: `u-oauth-${provider}-${Date.now()}`,
        name: `${randomUser.name} (${provider.charAt(0).toUpperCase() + provider.slice(1)})`,
      };
      mockData.getActors().push(oauthUser);
      
      return NextResponse.json({
        accessToken: `mock-jwt-token-${oauthUser.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${oauthUser.id}-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: oauthUser.id,
          name: oauthUser.name,
          email: oauthUser.email,
          role: oauthUser.role,
        },
      });
    }
    
    if (path === 'phone/send-otp' || path === 'phone') {
      return NextResponse.json({
        success: true,
        message: `A verification code has been sent. (Use code: 123456)`,
      });
    }
    
    if (path === 'phone/verify-otp' || path === 'verify-otp') {
      const body = await request.json();
      const code = body.code;
      const phone = body.phone || 'sms';
      
      if (code !== '123456') {
        return NextResponse.json({ message: 'Invalid verification code. Enter "123456" for testing.' }, { status: 400 });
      }
      
      const phoneUser: Actor = {
        id: `u-phone-${Date.now()}`,
        name: 'Phone User',
        email: `${phone.replace(/\D/g, '') || 'user'}@phone.sentinel.com`,
        role: 'Analyst',
      };
      mockData.getActors().push(phoneUser);
      
      return NextResponse.json({
        accessToken: `mock-jwt-token-${phoneUser.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${phoneUser.id}-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: phoneUser.id,
          name: phoneUser.name,
          email: phoneUser.email,
          role: phoneUser.role,
        },
      });
    }
    
    if (path === 'mfa/verify') {
      const { code } = await request.json();
      if (code !== '123456') {
        return NextResponse.json({ message: 'Invalid MFA token. Enter "123456" for testing.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'MFA verified' });
    }
    
    if (path === 'passkey/verify') {
      const actors = mockData.getActors();
      const user = actors[0];
      const passkeyUser: Actor = {
        ...user,
        id: `u-passkey-${Date.now()}`,
        name: `${user.name} (Passkey)`,
      };
      mockData.getActors().push(passkeyUser);
      
      return NextResponse.json({
        accessToken: `mock-jwt-token-${passkeyUser.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${passkeyUser.id}-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: passkeyUser.id,
          name: passkeyUser.name,
          email: passkeyUser.email,
          role: passkeyUser.role,
        },
      });
    }
    
    if (path === 'email/verify-otp' || path === 'verify-email') {
      const { code } = await request.json();
      if (code !== '123456') {
        return NextResponse.json({ message: 'Invalid verification code. Enter "123456" for testing.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Email verified successfully' });
    }
    
    if (path === 'forgot-password') {
      const { email } = await request.json();
      return NextResponse.json({
        success: true,
        message: `If an account exists for ${email}, a reset link has been sent.`,
      });
    }
    
    if (path === 'reset-password') {
      return NextResponse.json({ success: true, message: 'Password has been reset' });
    }
    
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Request failed' }, { status: 400 });
  }
}
