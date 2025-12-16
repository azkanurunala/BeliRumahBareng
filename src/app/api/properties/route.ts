import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPropertySchema, updatePropertySchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/properties - Get all properties dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const skip = (page - 1) * limit;

    // Build where clause untuk search dan filter
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (type) {
      where.type = type;
    }

    // Get properties dengan pagination
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedProperties = properties.map((property) => ({
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      images: property.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      planningInfo: property.sitePlanUrl
        ? {
            sitePlanUrl: property.sitePlanUrl,
            sitePlanHint: property.sitePlanHint || '',
            developmentPlan: property.developmentPlan || '',
            environmentalAnalysis: property.environmentalAnalysis || '',
          }
        : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedProperties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch properties',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create new property
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPropertySchema.parse(body);

    // Create property dengan images
    const property = await db.property.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        totalArea: validatedData.totalArea,
        location: validatedData.location,
        type: validatedData.type,
        totalUnits: validatedData.totalUnits,
        unitName: validatedData.unitName,
        unitSize: validatedData.unitSize,
        unitMeasure: validatedData.unitMeasure,
        sitePlanUrl: validatedData.sitePlanUrl || null,
        sitePlanHint: validatedData.sitePlanHint || null,
        developmentPlan: validatedData.developmentPlan || null,
        environmentalAnalysis: validatedData.environmentalAnalysis || null,
        images: {
          create: validatedData.images.map((img, index) => ({
            url: img.url,
            hint: img.hint,
            order: img.order ?? index,
          })),
        },
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Transform ke format yang diharapkan frontend
    const transformedProperty = {
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      images: property.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      planningInfo: property.sitePlanUrl
        ? {
            sitePlanUrl: property.sitePlanUrl,
            sitePlanHint: property.sitePlanHint || '',
            developmentPlan: property.developmentPlan || '',
            environmentalAnalysis: property.environmentalAnalysis || '',
          }
        : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedProperty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            errors: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to create property',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








