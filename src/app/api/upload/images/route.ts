import { NextRequest, NextResponse } from 'next/server';

// POST /api/upload/images - Upload multiple images
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

      // Convert file to base64 data URL
      // In production, you should upload to Firebase Storage, Vercel Blob, or similar service
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      uploadedImages.push({
        url: dataUrl,
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
        },
      },
      { status: 500 }
    );
  }
}



