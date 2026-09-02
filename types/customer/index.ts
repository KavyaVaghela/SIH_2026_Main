import type { Profile } from "../auth";
import type { Address } from "../common";

export interface Customer {
  id: string;
  profileId: string;
  profile?: Profile;
  defaultAddressId?: string | null;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}
