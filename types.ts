
export interface TimeLeft {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Capsule {
  name?: string;
  country: string;
  town: string;
  dob: string; // YYYY-MM-DD
  message: string;
  photos: string[]; // Base64 strings
  video?: string; // Base64 string (max 30 seconds)
  createdAt: Date;
  ageAtCreation: number;
  archivalTimestamp: {
    year: number;
    month: string;
    day: number;
    time: string;
  };
}
