import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Frontend deployment check',
    timestamp: new Date().toISOString(),
    endpoint_used: 'predict-disease-test',
    status: 'Frontend updated to use backup endpoint'
  });
}
