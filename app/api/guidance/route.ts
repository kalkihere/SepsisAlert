import { NextRequest, NextResponse } from 'next/server';
import { getMockGuidance } from '@/services/mockData';
import type { RiskLevel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.risk_level) {
      return NextResponse.json(
        { error: 'Missing risk level' },
        { status: 400 }
      );
    }

    const riskLevel = data.risk_level as RiskLevel;
    
    if (!['RED', 'AMBER', 'GREEN'].includes(riskLevel)) {
      return NextResponse.json(
        { error: 'Invalid risk level' },
        { status: 400 }
      );
    }

    // In production, this would call AWS Bedrock via API Gateway
    // For now, use mock guidance
    const guidance = getMockGuidance(riskLevel);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(guidance);
  } catch (error) {
    console.error('Guidance API error:', error);
    return NextResponse.json(
      { error: 'Guidance service unavailable' },
      { status: 500 }
    );
  }
}
