export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  categoryId: string;
  category?: ServiceCategory;
  title: string;
  description?: string | null;
  basePrice: number;
  priceUnit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  createdAt: string;
}
