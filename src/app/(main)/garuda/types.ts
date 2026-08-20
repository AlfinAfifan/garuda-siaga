export type GarudaMember = {
  _id: string;
  name: string;
  nta?: string;
};

export type GarudaInstitution = {
  _id: string;
  name: string;
};

export type GarudaData = {
  _id: string;
  member_id: GarudaMember;
  institution?: GarudaInstitution | null;
  level_tku: string;
  total_tkk: string;
  status: number;
  approved_by: string | null;
  approved_at: string | null;
  certificate_number: number | null;
  certificate_year: number | null;
  createdAt: string;
  updatedAt: string;
};