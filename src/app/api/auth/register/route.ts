import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });

    const { name, email, password } = parsed.data;
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and family in one atomic operation using nested create
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'PARENT',
        family: {
          create: { name: `Keluarga ${name}` },
        },
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint violation for email
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta?.target === 'User_email_key'
    ) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 } // Conflict
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}