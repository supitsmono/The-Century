/**
 * Capsule Type Mapping
 * 
 * Maps between backend API format and frontend UI format
 * Backend uses: openAt (Date), photos_paths (string[]), state, payment_id, etc.
 * Frontend UI uses: archivalTimestamp (object), photos (string[] for now), etc.
 */

import { CapsuleResponse } from './api';
import { Capsule } from '../types';

// Date conversion helpers (dob: YYYY-MM-DD ↔ dobDay/dobMonth/dobYear)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Convert UI dob format (dobDay, dobMonth, dobYear) to ISO string (YYYY-MM-DD)
 */
export function uiDobToIso(dobDay: string, dobMonth: string, dobYear: string): string {
  const monthIndex = MONTHS.indexOf(dobMonth); // 0-based
  if (monthIndex === -1) {
    throw new Error(`Invalid month: ${dobMonth}`);
  }
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(dobDay).padStart(2, '0');
  return `${dobYear}-${mm}-${dd}`;
}

/**
 * Convert ISO string (YYYY-MM-DD) to UI dob format (dobDay, dobMonth, dobYear)
 */
export function isoToUiDob(iso: string): { dobDay: string; dobMonth: string; dobYear: string } {
  const [y, m, d] = iso.split('-');
  const monthIndex = parseInt(m, 10) - 1; // Convert to 0-based
  if (monthIndex < 0 || monthIndex >= MONTHS.length) {
    throw new Error(`Invalid month index: ${monthIndex}`);
  }
  return {
    dobYear: y,
    dobMonth: MONTHS[monthIndex],
    dobDay: String(Number(d)), // Remove leading zeros
  };
}

// Frontend UI Capsule format (what the wizard uses) - same as types.ts Capsule
// This type alias is for clarity
export type UICapsule = Capsule;

/**
 * Map backend API response to UI format (Capsule type)
 */
export function mapBackendToUI(backend: CapsuleResponse): Capsule {
  // Convert openAt (Date string) to archivalTimestamp format
  const openAt = new Date(backend.openAt);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const archivalTimestamp = {
    year: openAt.getUTCFullYear(),
    month: months[openAt.getUTCMonth()],
    day: openAt.getUTCDate(),
    time: `${String(openAt.getUTCHours()).padStart(2, '0')}:${String(openAt.getUTCMinutes()).padStart(2, '0')}`,
  };

  // Map photos_paths to photos (for now, Phase 3B will handle storage paths)
  const photos = backend.photos_paths || backend.photos || [];
  
  // Map video_path to video (for now)
  const video = backend.video_path || backend.video;

  // Note: Capsule type doesn't include public_id/state/payment_id/email
  // These are backend-only fields. For Phase 3A, we just map the UI-relevant fields.
  return {
    name: backend.name,
    country: backend.country,
    town: backend.town,
    dob: backend.dob,
    message: backend.message,
    photos,
    video,
    createdAt: new Date(backend.createdAt),
    ageAtCreation: backend.ageAtCreation,
    archivalTimestamp,
  };
}

/**
 * Map UI format to backend create request format
 */
export function mapUIToCreateRequest(ui: Partial<UICapsule>, email?: string): {
  capsule: {
    name?: string;
    country: string;
    town: string;
    dob: string;
    message: string;
    openAt?: string; // ISO datetime string
    ageAtCreation?: number;
  };
  email?: string;
} {
  // Convert archivalTimestamp to openAt (ISO datetime string)
  // If archivalTimestamp is provided, convert it; otherwise use default (2125-01-01)
  let openAt: string | undefined;
  if (ui.archivalTimestamp) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(ui.archivalTimestamp.month);
    const [hours, minutes] = ui.archivalTimestamp.time.split(':').map(Number);
    
    const date = new Date(Date.UTC(
      ui.archivalTimestamp.year,
      monthIndex,
      ui.archivalTimestamp.day,
      hours || 0,
      minutes || 0,
      0,
      0
    ));
    
    openAt = date.toISOString();
  }

  return {
    capsule: {
      name: ui.name,
      country: ui.country!,
      town: ui.town!,
      dob: ui.dob!,
      message: ui.message!,
      openAt,
      ageAtCreation: ui.ageAtCreation,
    },
    email: email || ui.email,
  };
}
