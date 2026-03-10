import { NextRequest, NextResponse } from 'next/server';
import { mockPatients, mockScans } from '@/services/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // In production, this would query DynamoDB via API Gateway
    // For now, use mock data
    const patient = mockPatients.find(p => p.id === patientId);
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const scans = mockScans
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      patient,
      scans,
    });
  } catch (error) {
    console.error('Patient history API error:', error);
    return NextResponse.json(
      { error: 'History service unavailable' },
      { status: 500 }
    );
  }
}
