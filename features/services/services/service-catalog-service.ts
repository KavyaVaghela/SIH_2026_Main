import type { ServiceCategory, Service, Skill, Certification } from "@/types";

export interface IServiceCatalogService {
  getCategories(): Promise<ServiceCategory[]>;
  getServicesByCategory(categoryId: string): Promise<Service[]>;
  getServiceById(serviceId: string): Promise<Service | null>;
  getSkills(): Promise<Skill[]>;
  getCertifications(): Promise<Certification[]>;
}

export class ServiceCatalogService implements IServiceCatalogService {
  async getCategories(): Promise<ServiceCategory[]> {
    return [
      { id: "cat-1", name: "Electrical & Wiring", description: "Home electrical repairs", iconName: "Zap", isActive: true, createdAt: new Date().toISOString() },
      { id: "cat-2", name: "Plumbing & Drainage", description: "Leakage, fittings and tank cleaning", iconName: "Droplet", isActive: true, createdAt: new Date().toISOString() },
      { id: "cat-3", name: "Deep House Cleaning", description: "Full house sanitization and scrubbing", iconName: "Sparkles", isActive: true, createdAt: new Date().toISOString() },
    ];
  }

  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    return [
      {
        id: "srv-1",
        categoryId,
        title: "Electrical Repair & Main Switchboard Wiring",
        description: "Diagnostic and fix for electrical faults",
        basePrice: 350,
        priceUnit: "per_hour",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async getServiceById(serviceId: string): Promise<Service | null> {
    return {
      id: serviceId,
      categoryId: "cat-1",
      title: "Electrical Repair & Main Switchboard Wiring",
      description: "Diagnostic and fix for electrical faults",
      basePrice: 350,
      priceUnit: "per_hour",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getSkills(): Promise<Skill[]> {
    return [
      { id: "sk-1", name: "Main Switchboard Repair", categoryId: "cat-1", createdAt: new Date().toISOString() },
      { id: "sk-2", name: "Concealed Pipe Fitting", categoryId: "cat-2", createdAt: new Date().toISOString() },
    ];
  }

  async getCertifications(): Promise<Certification[]> {
    return [
      { id: "cert-1", title: "NSDC Electrical Certification", issuingBody: "NSDC India", validityMonths: 36, createdAt: new Date().toISOString() },
    ];
  }
}

export const serviceCatalogService = new ServiceCatalogService();
