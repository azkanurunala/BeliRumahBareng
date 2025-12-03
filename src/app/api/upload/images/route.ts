import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// POST /api/upload/images - Upload multiple images with compression
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No images provided', code: 'NO_IMAGES' } },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const uploadedImages: Array<{ url: string; hint: string }> = [];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `File type ${file.type} is not allowed. Allowed types: JPEG, PNG, WebP`,
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
              message: `File ${file.name} is too large. Maximum size is 5MB`,
              code: 'FILE_TOO_LARGE',
            },
          },
          { status: 400 }
        );
      }

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Compress and resize image using sharp
      const compressedBuffer = await sharp(buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 45 }) // 40-50% quality as specified
        .toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = 'webp';
      const filename = `images/${timestamp}-${randomString}.${extension}`;

      // Upload to Vercel Blob
      const blob = await put(filename, compressedBuffer, {
        access: 'public',
        contentType: 'image/webp',
      });

      uploadedImages.push({
        url: blob.url,
        hint: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedImages,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to upload images',
          code: 'UPLOAD_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}



