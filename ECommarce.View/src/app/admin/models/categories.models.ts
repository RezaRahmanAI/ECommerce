export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
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
  parentId: number | null;
  orderedIds: number[];
}
