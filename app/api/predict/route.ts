import { NextRequest, NextResponse } from 'next/server';
import { getMockPrediction } from '@/services/mockData';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.heart_rate || !data.spo2 || !data.temperature) {
      return NextResponse.json(
        { error: 'Missing required vital signs' },
        { status: 400 }
      );
    }

    // In production, this would call AWS SageMaker via API Gateway
    // For now, use mock prediction
    const prediction = getMockPrediction(
      data.heart_rate,
      data.spo2,
      data.temperature
    );

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Predict API error:', error);
    return NextResponse.json(
      { error: 'Prediction service unavailable' },
      { status: 500 }
    );
  }
}
