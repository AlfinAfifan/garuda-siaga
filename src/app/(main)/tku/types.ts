export interface TkuData {
  _id: string;
  member_id: string;
  mula: boolean;
  bantu: boolean;
  tata: boolean;
  sk_mula: string;
  sk_bantu: string;
  sk_tata: string;
  date_mula: string | null;
  date_bantu: string | null;
  date_tata: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    name: string;
    phone: string;
    member_number: string;
  };
  institution?: {
    _id: string;
    name: string;
  };
}

export interface TkuPayload {
  member_id: string;
  mula?: boolean;
  bantu?: boolean;
  tata?: boolean;
  sk_mula?: string;
  sk_bantu?: string;
  sk_tata?: string;
  date_mula?: string | null;
  date_bantu?: string | null;
  date_tata?: string | null;
}
