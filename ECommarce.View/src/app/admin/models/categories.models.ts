export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  sortOrder: number;
  collections?: Collection[];
  childCategories?: Category[];
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  isActive: boolean;
}

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

export interface ReorderPayload {
  parentId: string | null;
  orderedIds: string[];
}
