// types/profiles.ts
export interface UserData {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameKana: string | null;
  bio: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  headerText: string | null;
  textColor: string | null;
  corporateRole: string | null;
  position: string | null;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface ProfileUpdateData {
  name?: string;
  nameEn?: string | null;
  nameKana?: string | null;
  bio?: string | null;
  phone?: string | null;
  position?: string | null;
  image?: string | null;
  headerText?: string | null;
  textColor?: string | null;
}
