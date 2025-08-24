export interface TkkData {
  _id: string;
  member_id: string;
  sk: string;
  date: string | null;
  examiner_name: string;
  examiner_address: string;
  examiner_position: string;
  createdAt: string;
  updatedAt: string;
  type_tkk: {
    id: string;
    name: string;
  };
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
  sk?: string;
  date?: string | null;
}
