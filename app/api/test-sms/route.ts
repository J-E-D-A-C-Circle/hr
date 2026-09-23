import { NextResponse } from 'next/server';
import { sendWigalSms } from '@/lib/wigal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    const result = await sendWigalSms({
      destination: phoneNumber,
      message: message || 'Hello! This is a test SMS from DVLA NSS Portal.',
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      wigalResponse: result.data,
      formattedNumber: result.formattedNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error sending test SMS' },
      { status: 500 }
    );
  }
}
