export type GarudaMember = {
  _id: string;
  name: string;
};

export type GarudaData = {
  _id: string;
  member_id: GarudaMember;
  level_tku: string;
  total_tkk: string;
  status: number;
  approved_by: string | null;
  createdAt: string;
  updatedAt: string;
};