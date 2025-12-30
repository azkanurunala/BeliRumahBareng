'use server';

import { db } from '@/lib/db';
import { createPropertySchema, updatePropertySchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Property Operations
 */

export async function createProperty(data: z.infer<typeof createPropertySchema>) {
  try {
    // Validate input
    const validatedData = createPropertySchema.parse(data);

    // Create property dengan images
    const property = await db.property.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        totalArea: validatedData.totalArea,
        buildingArea: validatedData.buildingArea,
        location: validatedData.location,
        type: validatedData.type,
        totalUnits: validatedData.totalUnits,
        unitName: validatedData.unitName,
        unitSize: validatedData.unitSize,
        unitMeasure: validatedData.unitMeasure,
        unitPrices: validatedData.unitPrices ? JSON.parse(JSON.stringify(validatedData.unitPrices)) : null,
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
      } as any,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    }) as any;

    // Transform ke format yang diharapkan frontend
    const transformedProperty = {
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      buildingArea: (property as any).buildingArea ? Number((property as any).buildingArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      unitPrices: (property as any).unitPrices ? ((property as any).unitPrices as any) : undefined,
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

    revalidatePath('/admin/properties');
    revalidatePath('/api/properties');

    return {
      success: true,
      data: transformedProperty,
    };
  } catch (error) {
    console.error('Error creating property:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to create property',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateProperty(
  id: string,
  data: Partial<z.infer<typeof updatePropertySchema>>
) {
  try {
    // Check if property exists
    const existingProperty = await db.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return {
        success: false,
        error: {
          message: 'Property not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updatePropertySchema.parse({ ...data, id });

    // Update property
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.totalArea !== undefined) updateData.totalArea = validatedData.totalArea;
    if (validatedData.buildingArea !== undefined) updateData.buildingArea = validatedData.buildingArea;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.totalUnits !== undefined) updateData.totalUnits = validatedData.totalUnits;
    if (validatedData.unitName !== undefined) updateData.unitName = validatedData.unitName;
      if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
      if (validatedData.unitMeasure !== undefined) updateData.unitMeasure = validatedData.unitMeasure;
      if (validatedData.unitPrices !== undefined) updateData.unitPrices = validatedData.unitPrices ? JSON.parse(JSON.stringify(validatedData.unitPrices)) : null;
      if (validatedData.sitePlanUrl !== undefined) updateData.sitePlanUrl = validatedData.sitePlanUrl || null;
    if (validatedData.sitePlanHint !== undefined) updateData.sitePlanHint = validatedData.sitePlanHint || null;
    if (validatedData.developmentPlan !== undefined) updateData.developmentPlan = validatedData.developmentPlan || null;
    if (validatedData.environmentalAnalysis !== undefined) updateData.environmentalAnalysis = validatedData.environmentalAnalysis || null;

    // Handle images update
    if (validatedData.images !== undefined) {
      // Delete existing images
      await db.propertyImage.deleteMany({
        where: { propertyId: id },
      });

      // Create new images
      updateData.images = {
        create: validatedData.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: img.order ?? index,
        })),
      };
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
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
      buildingArea: (property as any).buildingArea ? Number((property as any).buildingArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      unitPrices: (property as any).unitPrices ? ((property as any).unitPrices as any) : undefined,
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

    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${id}`);
    revalidatePath('/api/properties');

    return {
      success: true,
      data: transformedProperty,
    };
  } catch (error) {
    console.error('Error updating property:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to update property',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteProperty(id: string) {
  try {
    // Check if property exists
    const property = await db.property.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!property) {
      return {
        success: false,
        error: {
          message: 'Property not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if property is used in any project
    if (property.projects.length > 0) {
      return {
        success: false,
        error: {
          message: 'Cannot delete property: property is used in one or more projects',
          code: 'CONFLICT',
        },
      };
    }

    // Delete property (images will be deleted automatically due to cascade)
    await db.property.delete({
      where: { id },
    });

    revalidatePath('/admin/properties');
    revalidatePath('/api/properties');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting property:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete property',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getProperty(id: string) {
  try {
    const property = await db.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!property) {
      return {
        success: false,
        error: {
          message: 'Property not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform ke format yang diharapkan frontend
    const transformedProperty = {
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      buildingArea: (property as any).buildingArea ? Number((property as any).buildingArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      unitPrices: (property as any).unitPrices ? ((property as any).unitPrices as any) : undefined,
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

    return {
      success: true,
      data: transformedProperty,
    };
  } catch (error) {
    console.error('Error fetching property:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch property',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getProperties(options?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const search = options?.search || '';
    const type = options?.type || '';
    const skip = (page - 1) * limit;

    // Build where clause
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
      buildingArea: (property as any).buildingArea ? Number((property as any).buildingArea) : undefined,
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

    return {
      success: true,
      data: transformedProperties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching properties:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch properties',
        code: 'FETCH_ERROR',
      },
    };
  }
}








