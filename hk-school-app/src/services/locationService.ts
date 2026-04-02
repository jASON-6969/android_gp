import { Geolocation } from "@capacitor/geolocation";

/** Per Nominatim usage policy: identify the application in the User-Agent. */
const NOMINATIM_UA = "HK-School-Explorer/1.0";

export interface StartupLocation {
  latitude: number;
  longitude: number;
  /** Human-readable address when reverse geocoding succeeds */
  address: string | null;
}

const reverseGeocodeAddress = async (latitude: number, longitude: number): Promise<string | null> => {
  const params = new URLSearchParams({
    format: "json",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1"
  });
  const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": NOMINATIM_UA
    }
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { display_name?: string };
  return typeof data.display_name === "string" ? data.display_name : null;
};

/**
 * Requests location permission, reads the current position, and resolves a display address via reverse geocoding.
 * Returns `null` if permission is denied or position cannot be read.
 */
export const getStartupLocation = async (): Promise<StartupLocation | null> => {
  try {
    const status = await Geolocation.checkPermissions();
    if (status.location !== "granted") {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== "granted") {
        return null;
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    let address: string | null = null;
    try {
      address = await reverseGeocodeAddress(latitude, longitude);
    } catch {
      address = null;
    }

    return { latitude, longitude, address };
  } catch {
    return null;
  }
};
