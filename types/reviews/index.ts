import type { Profile } from "../auth";
import type { Worker } from "../worker";

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customer?: Profile;
  workerId: string;
  worker?: Worker;
  rating: number; // 1-5
  comment?: string | null;
  createdAt: string;
}
