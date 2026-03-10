IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[ProductLandingPages]') 
    AND name = 'Subtitle'
)
BEGIN
    ALTER TABLE [ProductLandingPages] ADD [Subtitle] NVARCHAR(MAX) NULL;
END
GO
