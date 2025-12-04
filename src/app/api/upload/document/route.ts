import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// POST /api/upload/document - Upload document (PDF, images, etc.)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No document provided', code: 'NO_DOCUMENT' } },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB for documents
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File type ${file.type} is not allowed. Allowed types: JPEG, PNG, WebP, PDF, DOC, DOCX`,
            code: 'INVALID_FILE_TYPE',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File ${file.name} is too large. Maximum size is 10MB`,
            code: 'FILE_TOO_LARGE',
          },
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let finalBuffer = buffer;
    let contentType = file.type;
    let extension = file.name.split('.').pop()?.toLowerCase() || 'bin';

    // If it's an image, compress it
    if (file.type.startsWith('image/')) {
      try {
        finalBuffer = await sharp(buffer)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 45 })
          .toBuffer();
        contentType = 'image/webp';
        extension = 'webp';
      } catch (error) {
        // If sharp fails, use original buffer
        console.warn('Failed to compress image, using original:', error);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `documents/${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, finalBuffer, {
      access: 'public',
      contentType,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        hint: file.name,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to upload document',
          code: 'UPLOAD_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

