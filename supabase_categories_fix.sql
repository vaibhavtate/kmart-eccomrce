-- ============================================================
-- K MART — CATEGORIES TABLE FIX
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Create the categories table if it doesn't exist
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  emoji       text,
  image_url   text,
  icon_url    text,
  item_count  int,
  parent_id   uuid references public.categories(id),
  subcategories text[], -- array of subcategory name strings
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Step 2: Allow anonymous/public reads (categories are public catalog data)
alter table public.categories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select to anon, authenticated
  using (active = true);

-- Step 3: Seed the categories catalog
insert into public.categories (name, slug, emoji, image_url, item_count, subcategories, sort_order)
values
  ('Groceries',                 'groceries',                  '🌾', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80', 120, ARRAY['Atta, Rice & Dal','Oils & Ghee','Masalas & Spices','Dry Fruits','Sugar & Salt'], 1),
  ('Dairy & Eggs',              'dairy-and-eggs',             '🥛', 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=300&q=80',  45, ARRAY['Milk','Curd & Yogurt','Paneer & Butter','Eggs','Cheese'], 2),
  ('Snacks & Beverages',        'snacks-and-beverages',       '🍪', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80',  88, ARRAY['Biscuits & Cookies','Chips & Crisps','Namkeen','Chocolates'], 3),
  ('Beverages',                 'beverages',                  '🥤', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80',  52, ARRAY['Tea','Coffee','Juices','Energy Drinks','Soft Drinks'], 4),
  ('Breakfast & Ready to Cook', 'breakfast-and-ready-to-cook','🥣', 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=300&q=80',  64, ARRAY['Cereals & Flakes','Noodles & Pasta','Instant Mixes','Poha & Oats'], 5),
  ('Sauces & Spreads',          'sauces-and-spreads',         '🥫', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80',  38, ARRAY['Tomato Ketchup','Jams & Honey','Pickles & Chutneys','Mayonnaise'], 6),
  ('Personal Care',             'personal-care',              '🧴', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',  76, ARRAY['Oral Care','Hair Care','Bath & Body','Hand Wash'], 7),
  ('Household',                 'household',                  '🧼', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80',  94, ARRAY['Detergents','Dishwashing','Cleaners','Repellents'], 8),
  ('Home Utility',              'home-utility',               '🏠', 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80',  42, ARRAY['Foil & Wraps','Storage','Batteries'], 9),
  ('Kitchen & Dining',          'kitchen-and-dining',         '🍽️', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80',  56, ARRAY['Cookware','Storage Containers','Bottles & Flasks'], 10),
  ('Pooja Needs',               'pooja-needs',                '🪔', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80',  30, ARRAY['Camphor','Agarbatti','Diya Oil & Wicks'], 11),
  ('Stationery & Office',       'stationery-and-office',      '✏️', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',  28, ARRAY['Adhesives & Tapes','Pens & Pencils','Notebooks'], 12),
  ('Baby Care',                 'baby-care',                  '👶', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=300&q=80',  35, ARRAY['Diapers','Wipes','Baby Bath'], 13),
  ('Pet Care',                  'pet-care',                   '🐶', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80',  22, ARRAY['Dog Food','Cat Food','Pet Treats'], 14)
on conflict (slug) do update
  set
    name          = excluded.name,
    emoji         = excluded.emoji,
    image_url     = excluded.image_url,
    item_count    = excluded.item_count,
    subcategories = excluded.subcategories,
    sort_order    = excluded.sort_order,
    active        = true;

-- Verify: should return 14 rows
select id, name, slug, active from public.categories order by sort_order;
