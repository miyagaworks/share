// 名刺印刷会社の収集データ型定義

export interface PrintingCompany {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number | null;
  reviewCount: number;
  prefecture: string;
  placeId: string;
  businessStatus: string;
  types: string[];
}

export interface Prefecture {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  radius: number; // meters
}

// Places API (New) の型定義
export interface NewPlacesSearchResponse {
  places?: NewPlace[];
  nextPageToken?: string;
}

export interface NewPlace {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
}
