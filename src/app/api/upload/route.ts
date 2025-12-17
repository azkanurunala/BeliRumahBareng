import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// POST /api/upload - Upload file (generic, supports documents, images, payment receipts)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file provided', code: 'NO_FILE' } },
        { status: 400 }
      );
    }

    // Determine allowed types and max size based on type
    let maxSize: number;
    let allowedTypes: string[];
    let shouldCompress: boolean = false;

    if (type === 'payment-receipt') {
      // Payment receipts: images and PDFs
      maxSize = 10 * 1024 * 1024; // 10MB
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf',
      ];
      shouldCompress = true; // Compress images
    } else if (type === 'document') {
      // Documents: images, PDFs, Word docs
      maxSize = 10 * 1024 * 1024; // 10MB
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      shouldCompress = true; // Compress images
    } else {
      // Default: images only
      maxSize = 5 * 1024 * 1024; // 5MB
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      shouldCompress = true;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
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
            message: `File ${file.name} is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
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

    // If it's an image and compression is enabled, compress it
    if (shouldCompress && file.type.startsWith('image/')) {
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

    // Generate unique filename based on type
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const folder = type === 'payment-receipt' ? 'payment-receipts' : type === 'document' ? 'documents' : 'images';
    const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

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
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to upload file',
          code: 'UPLOAD_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

