import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.patient_id || !data.heart_rate || !data.spo2 || !data.temperature) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, this would forward to AWS API Gateway
    // For now, return mock success response
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      scanId,
      message: 'Scan data received successfully',
    });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
