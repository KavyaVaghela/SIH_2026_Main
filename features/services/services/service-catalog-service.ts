export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  basePrice: number;
  minimumVisitCharge: number;
  priceUnit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceCatalogService {
  getCategories(): Promise<ServiceCategory[]>;
  getServicesByCategory(categoryId: string): Promise<ServiceItem[]>;
  getServiceDetails(serviceId: string): Promise<ServiceItem | null>;
  getAllActiveServices(): Promise<ServiceItem[]>;
}

export class ServiceCatalogService implements IServiceCatalogService {
  private categories: ServiceCategory[] = [
    { id: "cat-1", name: "Electrical & Wiring", description: "Home electrical repairs & installations", iconName: "Zap", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-2", name: "Plumbing & Drainage", description: "Tap repairs, pipe leakage, water tanks", iconName: "Droplet", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-3", name: "Deep House Cleaning", description: "Full house sanitization and deep clean", iconName: "Sparkles", isActive: true, createdAt: new Date().toISOString() },
  ];

  private services: ServiceItem[] = [
    { id: "srv-1", categoryId: "cat-1", title: "Full Room Electrical Repair & Wiring", description: "Switch and socket repair", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-2", categoryId: "cat-2", title: "Pipeline Leakage & Tap Replacement", description: "Fixing pipe leaks and valves", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-3", categoryId: "cat-3", title: "Full 2BHK Deep Cleaning", description: "Complete sanitization and scrubbing", basePrice: 1800, minimumVisitCharge: 1500, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  async getCategories(): Promise<ServiceCategory[]> {
    return this.categories.filter((c) => c.isActive);
  }

  async getServicesByCategory(categoryId: string): Promise<ServiceItem[]> {
    return this.services.filter((s) => s.categoryId === categoryId && s.isActive);
  }

  async getServiceDetails(serviceId: string): Promise<ServiceItem | null> {
    return this.services.find((s) => s.id === serviceId) || null;
  }

  async getAllActiveServices(): Promise<ServiceItem[]> {
    return this.services.filter((s) => s.isActive);
  }
}

export const serviceCatalogService = new ServiceCatalogService();
