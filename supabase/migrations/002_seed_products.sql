-- =============================================
-- SEED: Product Catalog
-- Promotional / branded merchandise items
-- =============================================

INSERT INTO products (name, description, category, base_price, available_sizes, available_colors) VALUES

-- Apparel
('Classic T-Shirt', 'Soft 100% cotton crew neck tee, ideal for screen printing', 'Apparel',
  8.50,
  ARRAY['XS','S','M','L','XL','2XL','3XL'],
  ARRAY['White','Black','Navy','Red','Royal Blue','Forest Green','Heather Gray','Maroon']
),
('Premium Polo Shirt', 'Pique cotton polo, professional look with embroidery area', 'Apparel',
  18.00,
  ARRAY['S','M','L','XL','2XL','3XL'],
  ARRAY['White','Black','Navy','Red','Royal Blue','Forest Green']
),
('Zip-Up Hoodie', 'Mid-weight fleece zip hoodie with front kangaroo pocket', 'Apparel',
  28.00,
  ARRAY['S','M','L','XL','2XL','3XL'],
  ARRAY['Black','Navy','Charcoal','Red','Royal Blue']
),
('Pullover Hoodie', 'Classic pullover fleece hoodie', 'Apparel',
  24.00,
  ARRAY['S','M','L','XL','2XL','3XL'],
  ARRAY['Black','Navy','Charcoal','Red','Royal Blue','White']
),

-- Headwear
('Structured Cap', 'Classic 6-panel structured cap with buckle closure', 'Headwear',
  12.00,
  ARRAY['One Size'],
  ARRAY['Black','Navy','Red','White','Khaki','Royal Blue','Forest Green']
),
('Beanie', 'Double-layer knit beanie, one size fits most', 'Headwear',
  9.00,
  ARRAY['One Size'],
  ARRAY['Black','Navy','Red','Gray','White','Forest Green']
),

-- Drinkware
('16oz Stainless Travel Mug', 'Double-wall vacuum insulated stainless steel, laser engrave area', 'Drinkware',
  22.00,
  ARRAY['16oz'],
  ARRAY['Black','Silver','White','Navy','Red']
),
('20oz Tumbler', 'Slim 20oz stainless tumbler with slide-open lid', 'Drinkware',
  18.00,
  ARRAY['20oz'],
  ARRAY['Black','Silver','White','Navy','Rose Gold','Forest Green']
),
('Ceramic Coffee Mug', '11oz white ceramic mug, dishwasher safe', 'Drinkware',
  6.50,
  ARRAY['11oz','15oz'],
  ARRAY['White','Black']
),

-- Bags
('Canvas Tote Bag', '100% cotton canvas tote, sturdy handles', 'Bags',
  7.00,
  ARRAY['Standard'],
  ARRAY['Natural','Black','Navy','Red']
),
('Backpack', 'Polyester daypack with laptop sleeve and multiple pockets', 'Bags',
  32.00,
  ARRAY['Standard'],
  ARRAY['Black','Navy','Gray','Red']
),

-- Stationery
('Spiral Notebook', 'A5 spiral notebook, 80 lined pages', 'Stationery',
  5.50,
  ARRAY['A5','A4'],
  ARRAY['Black','Blue','Red','White','Yellow']
),
('Pen Set', 'Metal ballpoint pen with engraving area', 'Stationery',
  4.00,
  ARRAY['Single'],
  ARRAY['Silver','Black','Gold','Blue']
),

-- Tech
('USB-C Hub', '4-port USB-C hub with HDMI and USB-A ports', 'Tech',
  28.00,
  ARRAY['Standard'],
  ARRAY['Black','Silver','White']
),
('Wireless Charging Pad', 'Qi-compatible 10W wireless charger, soft touch finish', 'Tech',
  18.00,
  ARRAY['Standard'],
  ARRAY['Black','White']
),

-- Desk / Office
('Mouse Pad', 'Large desk mat with stitched edges, 800x400mm', 'Desk',
  14.00,
  ARRAY['Standard (800x400mm)','Large (900x400mm)'],
  ARRAY['Black','Gray','Navy']
),
('Sticky Notes Set', 'Set of 4 sticky note pads in custom packaging', 'Stationery',
  3.50,
  ARRAY['Standard'],
  ARRAY['Yellow','Blue','Pink','Green','Assorted']
);
