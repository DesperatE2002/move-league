// API Response Helper Functions
// Standart response formatları

import { NextResponse } from 'next/server';

export function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json({
    success: true,
    message: message || 'Success',
    data,
  }, { status });
}

export function errorResponse(message: string, status: number = 400, error?: any) {
  return NextResponse.json({
    success: false,
    message,
    error: error?.message || error,
  }, { status });
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({
    success: false,
    message,
  }, { status: 401 });
}

export function notFoundResponse(message: string = 'Not found') {
  return NextResponse.json({
    success: false,
    message,
  }, { status: 404 });
}
