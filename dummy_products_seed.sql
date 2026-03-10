-- SQL Script to add 5 Dummy Products with Landing Pages, Orders, and Reviews
-- Updated for Dashboard Compatibility

-- 1. Insert Products
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, IsNew, IsFeatured, IsItemProduct, CategoryId, SubCategoryId, CollectionId, SortOrder, CreatedAt, UpdatedAt)
VALUES 
('Men''s Premium Slim Fit Panjabi', 'mens-premium-slim-fit-panjabi', 'High quality cotton panjabi with elegant slim fit design.', 'Premium cotton panjabi for special occasions.', 'MEN-PAN-DUM-01', 'https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800', 3500.00, 4500.00, 1800.00, 50, 1, 1, 1, 1, (SELECT Id FROM Categories WHERE Slug = 'men' LIMIT 1), (SELECT Id FROM SubCategories WHERE Slug = 'panjabi' LIMIT 1), NULL, 1, GETDATE(), GETDATE()),

('Women''s Floral Chiffon Abaya', 'womens-floral-chiffon-abaya', 'Elegant floral print chiffon abaya with matching scarf.', 'Stylish and modest floral abaya.', 'WOM-ABA-DUM-01', 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', 5800.00, 7200.00, 3200.00, 35, 1, 1, 1, 1, (SELECT Id FROM Categories WHERE Slug = 'women' LIMIT 1), (SELECT Id FROM SubCategories WHERE Slug = 'abaya' LIMIT 1), NULL, 2, GETDATE(), GETDATE()),

('Kids'' Royal Silk Sherwani', 'kids-royal-silk-sherwani', 'Luxurious silk sherwani for kids, perfect for weddings.', 'Regal kids'' sherwani in royal blue.', 'KID-SHR-DUM-01', 'https://images.unsplash.com/photo-1518837697477-94d4777248d6?w=800', 4200.00, 5500.00, 2200.00, 20, 1, 1, 1, 1, (SELECT Id FROM Categories WHERE Slug = 'kids' LIMIT 1), (SELECT Id FROM SubCategories WHERE Slug = 'boys' LIMIT 1), NULL, 3, GETDATE(), GETDATE()),

('Handmade Leather Wallet - Tan', 'handmade-leather-wallet-tan', 'Genuine handmade leather wallet with multiple card slots.', 'Durable tan leather wallet.', 'ACC-WAL-DUM-01', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', 1500.00, 2200.00, 600.00, 100, 1, 1, 1, 1, (SELECT Id FROM Categories WHERE Slug = 'accessories' LIMIT 1), (SELECT Id FROM SubCategories WHERE Slug = 'wallets' LIMIT 1), NULL, 4, GETDATE(), GETDATE()),

('Classic Emerald Necklace Set', 'classic-emerald-necklace-set', 'Stunning emerald and gold-plated necklace set with earrings.', 'Elegant emerald jewelry set.', 'ACC-JEW-DUM-01', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', 8500.00, 12000.00, 4500.00, 15, 1, 1, 1, 1, (SELECT Id FROM Categories WHERE Slug = 'accessories' LIMIT 1), NULL, NULL, 5, GETDATE(), GETDATE());

-- 2. Insert Product Landing Pages
INSERT INTO ProductLandingPages (ProductId, Headline, VideoUrl, BenefitsTitle, BenefitsContent, ReviewsTitle, ReviewsImages, SideEffectsTitle, SideEffectsContent, UsageTitle, UsageContent, ThemeColor, CreatedAt, UpdatedAt)
SELECT Id, 'Experience Elegance with Our Premium Panjabi', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Why Choose Our Panjabi?', '<ul><li>100% Breathable Cotton</li><li>Slim Fit Design</li><li>Fade Resistant Color</li></ul>', 'Customer Feedback', '[]', NULL, NULL, 'Washing Instructions', '<p>Hand wash in cold water. Do not bleach.</p>', '#1a1a1a', GETDATE(), GETDATE() FROM Products WHERE Sku = 'MEN-PAN-DUM-01';

INSERT INTO ProductLandingPages (ProductId, Headline, VideoUrl, BenefitsTitle, BenefitsContent, ReviewsTitle, ReviewsImages, SideEffectsTitle, SideEffectsContent, UsageTitle, UsageContent, ThemeColor, CreatedAt, UpdatedAt)
SELECT Id, 'Modest Elegance for Every Occasion', NULL, 'Key Features', '<ul><li>Premium Chiffon Fabric</li><li>Included Matching Scarf</li><li>Intricate Floral Print</li></ul>', 'What Customers Say', '[]', NULL, NULL, 'Care Guide', '<p>Dry clean only. Hang in a cool, dry place.</p>', '#c2185b', GETDATE(), GETDATE() FROM Products WHERE Sku = 'WOM-ABA-DUM-01';

-- 3. Insert Dummy Orders to populate Dashboard (Recent Orders & Popular Products)
-- Order 1
INSERT INTO Orders (OrderNumber, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress, Total, Status, CreatedAt, UpdatedAt)
VALUES ('ORD-' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR), 'Test Customer 1', 'test1@gmail.com', '01711111111', 'Dhaka, Bangladesh', 3500.00, 4, GETDATE(), GETDATE()); -- Status 4 = Delivered

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, CreatedAt, UpdatedAt)
SELECT LAST_INSERT_ROWID(), Id, 1, Price, GETDATE(), GETDATE() FROM Products WHERE Sku = 'MEN-PAN-DUM-01';

-- Order 2
INSERT INTO Orders (OrderNumber, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress, Total, Status, CreatedAt, UpdatedAt)
VALUES ('ORD-' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR), 'Test Customer 2', 'test2@gmail.com', '01722222222', 'Chittagong, Bangladesh', 5800.00, 0, GETDATE(), GETDATE()); -- Status 0 = Pending

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, CreatedAt, UpdatedAt)
SELECT (SELECT MAX(Id) FROM Orders), Id, 1, Price, GETDATE(), GETDATE() FROM Products WHERE Sku = 'WOM-ABA-DUM-01';

-- Order 3 (Make a product popular)
INSERT INTO Orders (OrderNumber, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress, Total, Status, CreatedAt, UpdatedAt)
VALUES ('ORD-' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR), 'Test Customer 3', 'test3@gmail.com', '01733333333', 'Sylhet, Bangladesh', 3000.00, 4, GETDATE(), GETDATE());

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, CreatedAt, UpdatedAt)
SELECT (SELECT MAX(Id) FROM Orders), Id, 2, Price, GETDATE(), GETDATE() FROM Products WHERE Sku = 'ACC-WAL-DUM-01';

-- 4. Insert Reviews
INSERT INTO Reviews (ProductId, CustomerName, Rating, Comment, IsApproved, CreatedAt, UpdatedAt)
SELECT Id, 'Happy Customer', 5, 'Truly premium feel. The fit is perfect!', 1, GETDATE(), GETDATE() FROM Products WHERE Sku = 'MEN-PAN-DUM-01';

INSERT INTO Reviews (ProductId, CustomerName, Rating, Comment, IsApproved, CreatedAt, UpdatedAt)
SELECT Id, 'Ayesha K.', 4, 'Very beautiful design, though the colors are slightly darker than the photo.', 1, GETDATE(), GETDATE() FROM Products WHERE Sku = 'WOM-ABA-DUM-01';
