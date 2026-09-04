export type GarudaMember = {
  _id: string;
  name: string;
  nta?: string;
  /** Data berikut hanya dipakai untuk mencetak surat ketetapan */
  gender?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  religion?: string | null;
  rt?: string | null;
  rw?: string | null;
  village?: string | null;
  sub_district?: string | null;
  district?: string | null;
  province?: string | null;
};

export type GarudaInstitution = {
  _id: string;
  name: string;
  /** Alamat & nomor gugus depan, dicetak pada surat ketetapan */
  address?: string | null;
  gudep_man?: string | null;
  gudep_woman?: string | null;
  head_gudep_man?: string | null;
  head_gudep_woman?: string | null;
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
