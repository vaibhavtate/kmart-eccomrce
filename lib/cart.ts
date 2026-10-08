import { supabase } from './supabase/client';
import { Product } from '@/types';
import { resolveImage } from '../services/products';

export interface RelatedProductItem {
  id: string;
  name: string;
  mrp: number;
  selling_price: number;
  image_url: string | null;
  weight_unit?: string | null;
  brand?: string | null;
}

/**
 * Fetch related products paired by admin in related_products table
 */
export async function fetchRelatedProducts(productId: string): Promise<RelatedProductItem[]> {
  if (!productId) return [];

  try {
    const { data, error } = await supabase
      .from('related_products')
      .select('related_product_id, related:related_product_id(id, name, mrp, selling_price, image_url)')
      .eq('product_id', productId);

    if (error) {
      console.warn('[cart] Error querying related_products:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const items: RelatedProductItem[] = [];

    for (const row of data) {
      const rel: any = Array.isArray(row.related) ? row.related[0] : row.related;
      if (rel && rel.id) {
        items.push({
          id: rel.id,
          name: rel.name,
          mrp: Number(rel.mrp || rel.selling_price || 0),
          selling_price: Number(rel.selling_price || rel.mrp || 0),
          image_url: rel.image_url || null,
        });
      }
    }

    return items;
  } catch (err: any) {
    console.warn('[cart] Exception querying related_products:', err?.message);
    return [];
  }
}

/**
 * Helper to transform RelatedProductItem into a full Product object
 */
export function toProduct(item: RelatedProductItem, cachedProducts: Product[] = []): Product {
  const cached = cachedProducts.find((p) => p.id === item.id);
  if (cached) return cached;

  const mrp = Number(item.mrp || item.selling_price || 0);
  const price = Number(item.selling_price || mrp);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return {
    id: item.id,
    name: item.name,
    category: 'Groceries',
    weight: item.weight_unit || '1 unit',
    price,
    originalPrice: mrp,
    discountPercent,
    rating: 4.5,
    reviewCount: 20,
    image: resolveImage(item.name, item.image_url),
    inStock: true,
    stockCount: 50,
    badge: discountPercent > 0 ? `${discountPercent}% OFF` : undefined,
    brand: item.brand || 'K MART',
    deliveryTime: 'Delivery on time',
    description: item.name,
  };
}
