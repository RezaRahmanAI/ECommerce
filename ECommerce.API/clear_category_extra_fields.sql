/*
  Run once after deploy to align existing category data
  with the simplified admin category form (id, name, imageUrl, isActive).
*/

BEGIN TRANSACTION;

-- Remove category hierarchy and ordering data
UPDATE [Categories]
SET [ParentId] = NULL,
    [DisplayOrder] = 0;

-- Clear optional metadata that is no longer used by admin category management
UPDATE [Categories]
SET [Icon] = NULL,
    [MetaTitle] = NULL,
    [MetaDescription] = NULL;

COMMIT TRANSACTION;
