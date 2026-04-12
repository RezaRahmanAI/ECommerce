/* 
    SHERASHOP BD PERFORMANCE INDEXES 
    This script adds strategic indexes to optimize gallery sorting, filtering, and search.
*/

-- 1. Optimized Gallery Listing (CategoryId + IsActive includes common fields)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Gallery_Performance' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Products_Gallery_Performance] ON [Products] ([CategoryId], [IsActive])
    INCLUDE ([Headline], [Price], [Slug], [CreatedAt], [IsNew])
    WHERE [IsActive] = 1;
END

-- 2. Sort Optimization (Fast sorting by Price and Date)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Sort_Price' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Products_Sort_Price] ON [Products] ([Price] ASC, [IsActive]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Sort_Date' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Products_Sort_Date] ON [Products] ([CreatedAt] DESC, [IsActive]);
END

-- 3. Search Performance (Optimized for name and SKU lookup)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Search_Performance' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Products_Search_Performance] ON [Products] ([Headline], [Sku])
    WHERE [IsActive] = 1;
END

-- 4. Order Management Performance (Fast lookup by customer and date)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_Performance' AND object_id = OBJECT_ID('Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Orders_Performance] ON [Orders] ([CreatedAt] DESC, [Status])
    INCLUDE ([OrderNumber], [Total], [CustomerName]);
END

PRINT 'Performance indexes applied successfully.';
