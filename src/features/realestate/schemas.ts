import { z } from 'zod';

const count = z.number().int().min(0);

export const estimateSchema = z.object({
  listingType: z.enum(['sale', 'rent']),
  propertyType: z.enum([
    'apartment',
    'studio',
    'duplex',
    'penthouse',
    'villa',
    'chalet',
    'shop',
    'office',
    'land',
  ]),
  city: z.string().min(1, 'Select a city'),
  district: z.string().min(1, 'Select a district'),
  area: z.number().positive('Enter an area greater than zero'),
  rooms: count,
  bathrooms: count,
  floor: z.number().int(),
  hasElevator: z.boolean(),
  buildingAge: count,
  finishing: z.enum(['none', 'semi', 'super-lux', 'ultra-lux']),
  furnished: z.boolean(),
  view: z.enum(['street', 'garden', 'nile', 'sea']),
});

export const propertySchema = estimateSchema.extend({
  title: z.string().trim().min(3, 'Enter a title'),
  description: z.string().trim().min(10, 'Add at least 10 characters'),
  address: z.string().trim().min(3, 'Enter an address'),
  price: z.number().positive('Enter a price greater than zero'),
  contactPhone: z.string().regex(
    /^(010|011|012|015)[0-9]{8}$/,
    'Enter an Egyptian mobile number (11 digits)',
  ),
  amenities: z.array(z.enum(['parking', 'security', 'garden', 'pool', 'gas', 'ac'])),
});

export type EstateFormValues = z.infer<typeof propertySchema>;

export const defaults: EstateFormValues = {
  listingType: 'sale',
  propertyType: 'apartment',
  city: '',
  district: '',
  area: 0,
  rooms: 0,
  bathrooms: 0,
  floor: 0,
  hasElevator: false,
  buildingAge: 0,
  finishing: 'none',
  furnished: false,
  view: 'street',
  title: '',
  description: '',
  address: '',
  price: 0,
  contactPhone: '',
  amenities: [],
};

export const calculatorSchema = estimateSchema.extend({
  title: z.string(),
  description: z.string(),
  address: z.string(),
  price: z.number(),
  contactPhone: z.string(),
  amenities: propertySchema.shape.amenities,
});
