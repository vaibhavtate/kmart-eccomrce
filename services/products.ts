import { supabase } from '../lib/supabase/client';
import { Product } from '../types';

const PRODUCT_IMAGE_FALLBACKS: { keywords: string[]; url: string }[] = [
  { keywords: ['surf', 'surf excel', 'detergent', 'matic', 'bar', 'soap', 'clean'], url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['salt', 'tata salt', 'tata', 'moong', 'dal', 'pulses', 'grain'], url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['handwash', 'lifebuoy', 'shampoo'], url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['maggi', 'noodle', 'noodles', 'pasta', 'parle', 'biscuit', 'biscuits', 'cookie'], url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['saffola', 'oil', 'cooking'], url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['rin', 'cleaner', 'scrub'], url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['tea', 'tata tea', 'chai'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['camphor', 'pooja', 'tablets'], url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['vim', 'dishwash'], url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['fevicol', 'adhesive', 'glue'], url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['foil', 'aluminium', 'freshwrapp'], url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['scotch', 'brite', 'scrub'], url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['good knight', 'mosquito', 'refill'], url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['diaper', 'mamypoko', 'pants'], url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['rice', 'basmati', 'india gate'], url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['atta', 'aashirvaad', 'flour', 'wheat'], url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['corn flakes', 'kellogg'], url: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['milk', 'dairy', 'amul'], url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['colgate', 'toothpaste', 'oral', 'brush'], url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
];

const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80';

// Blacklisted IDs of images containing fruits or vegetables
const FORBIDDEN_FRUIT_VEG_IMAGE_IDS = [
  'photo-1542838132-92c53300491e', // Vegetable display racks
  'photo-1588964895597-cfccd6e2dbf9', // Paper bag with apples, bananas & cabbage
  'photo-1610832958506-aa56368176cf', // Vegetables & fruits produce table
  'photo-1619566636858-adf3ef46400b', // Fruit bowl
  'photo-1597362925123-77861d3fbac7', // Vegetable market
  'photo-1571771894821-ce9b6c11b08e', // Bananas
  'photo-1560806887-1e4cd0b6cbd6', // Apples
  'photo-1592924357228-91a4daadcfea', // Tomatoes
  'photo-1518977676601-b53f82aba655', // Potatoes
  'photo-1618512496248-a07fe83aa8cb', // Onions
];

export function resolveImage(productName: string, imageUrl: string | null): string {
  const lower = productName.toLowerCase();
  for (const entry of PRODUCT_IMAGE_FALLBACKS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.url;
    }
  }
  if (
    imageUrl &&
    imageUrl.trim().length > 0 &&
    !FORBIDDEN_FRUIT_VEG_IMAGE_IDS.some((badId) => imageUrl.includes(badId))
  ) {
    return imageUrl;
  }
  return GENERIC_FALLBACK;
}

export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const productService = {
  async fetchDbProducts(storeId?: string, client = supabase): Promise<Product[]> {
    try {
      const pageSize = 1000;
      let allInventoryRows: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        let invQuery = client
          .from('inventory')
          .select(`
            product_id,
            stock_quantity,
            products!inner (
              id,
              name,
              mrp,
              selling_price,
              weight_unit,
              image_url,
              brand,
              description,
              active,
              category_id,
              categories ( id, name )
            )
          `)
          .gt('stock_quantity', 5)
          .eq('products.active', true);

        if (storeId) {
          invQuery = invQuery.eq('store_id', storeId);
        }

        const { data: batch, error } = await invQuery.range(offset, offset + pageSize - 1);

        if (error || !batch || batch.length === 0) {
          break;
        }

        allInventoryRows.push(...batch);

        if (batch.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }

      // If inventory query returned rows, map them
      if (allInventoryRows.length > 0) {
        // Group by product id to prevent duplicates if multiple inventory rows exist
        const productMap = new Map<string, { p: any; stockQty: number }>();

        for (const row of allInventoryRows) {
          const p = row.products;
          if (!p || !p.id) continue;

          const existing = productMap.get(p.id);
          const currentQty = Number(row.stock_quantity || 0);

          if (!existing) {
            productMap.set(p.id, { p, stockQty: currentQty });
          } else {
            // Aggregate or take max stock
            existing.stockQty = Math.max(existing.stockQty, currentQty);
          }
        }

        const mapped: Product[] = [];

        productMap.forEach(({ p, stockQty }) => {
          if (stockQty <= 5) return;

          const mrp = Number(p.mrp || 0);
          const sellingPrice = Number(p.selling_price || 0);
          const discountPercent =
            mrp > sellingPrice
              ? Math.round(((mrp - sellingPrice) / mrp) * 100)
              : 0;

          const dbCategoryName: string = p.categories?.name || '';
          const categorySlug = dbCategoryName
            ? categoryNameToSlug(dbCategoryName)
            : 'groceries';

          const resolvedImg = resolveImage(p.name, p.image_url);
          const cleanName = (p.name as string).replace(/^[\s.•·]+/, '').trim();

          mapped.push({
            id: p.id,
            name: cleanName,
            category: categorySlug,
            storeTag: `K MART | ${dbCategoryName ? dbCategoryName.toUpperCase() : 'GROCERIES'}`,
            weight: p.weight_unit || '1 unit',
            price: sellingPrice,
            originalPrice: mrp,
            discountPercent,
            rating: 4.5,
            reviewCount: 45,
            image: resolvedImg,
            inStock: true,
            stockCount: stockQty,
            maxPurchaseUnits: 24,
            badge: discountPercent > 0 ? `${discountPercent}% OFF` : undefined,
            brand: p.brand || 'K MART',
            deliveryTime: 'Delivery on time',
            highlights: [
              '100% Genuine Branded Pack',
              'Quality Guaranteed',
              'Best Market Price',
            ],
            description:
              p.description ||
              `${p.name} — fresh daily essential available for guaranteed on-time doorstep delivery from K MART.`,
          });
        });

        mapped.sort((a, b) => a.name.localeCompare(b.name));
        return mapped;
      }

      // Fallback query if no inventory rows found
      let fallbackQuery = client
        .from('products')
        .select(`
          *,
          categories ( id, name ),
          inventory ( store_id, stock_quantity )
        `)
        .eq('active', true)
        .order('name');

      const { data: dbProducts, error: fallbackError } = await fallbackQuery;

      if (fallbackError || !dbProducts || dbProducts.length === 0) {
        return [];
      }

      const mappedDb: Product[] = dbProducts
        .map((p: any) => {
          const discountPercent =
            p.mrp > p.selling_price
              ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100)
              : 0;

          const dbCategoryName: string = p.categories?.name || '';
          const categorySlug = dbCategoryName
            ? categoryNameToSlug(dbCategoryName)
            : 'groceries';

          let stockQty = 50;
          if (Array.isArray(p.inventory) && p.inventory.length > 0) {
            if (storeId) {
              const storeInv = p.inventory.find((inv: any) => inv.store_id === storeId);
              stockQty = storeInv?.stock_quantity ?? 0;
            } else {
              stockQty = p.inventory.reduce(
                (sum: number, inv: any) => sum + (inv.stock_quantity || 0),
                0
              );
            }
          } else if (p.inventory?.stock_quantity != null) {
            stockQty = p.inventory.stock_quantity;
          }

          const resolvedImg = resolveImage(p.name, p.image_url);
          const cleanName = (p.name as string).replace(/^[\s.•·]+/, '').trim();

          return {
            id: p.id,
            name: cleanName,
            category: categorySlug,
            storeTag: `K MART | ${dbCategoryName ? dbCategoryName.toUpperCase() : 'GROCERIES'}`,
            weight: p.weight_unit || '1 unit',
            price: Number(p.selling_price),
            originalPrice: Number(p.mrp),
            discountPercent,
            rating: 4.5,
            reviewCount: 45,
            image: resolvedImg,
            inStock: stockQty > 0,
            stockCount: stockQty,
            maxPurchaseUnits: 24,
            badge: discountPercent > 0 ? `${discountPercent}% OFF` : undefined,
            brand: p.brand || 'K MART',
            deliveryTime: 'Delivery on time',
            highlights: [
              '100% Genuine Branded Pack',
              'Quality Guaranteed',
              'Best Market Price',
            ],
            description:
              p.description ||
              `${p.name} — fresh daily essential available for guaranteed on-time doorstep delivery from K MART.`,
          };
        })
        .filter((p) => (p.stockCount ?? 0) > 5);

      return mappedDb;
    } catch (err: any) {
      console.warn('[productService] exception:', err?.message);
      return [];
    }
  },
};
