export interface Federation {
  id: string;
  name: string;
  code: string;
  gstNumber?: string | null;
  registrationNumber: string;
  state: string;
  city: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
