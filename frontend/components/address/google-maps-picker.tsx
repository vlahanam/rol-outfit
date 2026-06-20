"use client";

import { useCallback, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = { lat: 10.8231, lng: 106.6297 }; // Ho Chi Minh City

export interface MapPickerValue {
  address: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapsPickerProps {
  value?: Partial<MapPickerValue>;
  onChange: (value: MapPickerValue) => void;
  placeholder?: string;
}

export function GoogleMapsPicker({
  value,
  onChange,
  placeholder = "Search for an address...",
}: GoogleMapsPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    value?.latitude && value?.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : null
  );
  const [addressText, setAddressText] = useState(value?.address || "");

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      // Geocoder not available - just use coordinates as address
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddressText(fallbackAddress);
      onChange({ address: fallbackAddress, latitude: lat, longitude: lng });
      return;
    }

    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      });

      if (response.results[0]) {
        const address = response.results[0].formatted_address;
        setAddressText(address);
        onChange({ address, latitude: lat, longitude: lng });
      } else {
        // No results - use coordinates
        const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddressText(fallbackAddress);
        onChange({ address: fallbackAddress, latitude: lat, longitude: lng });
      }
    } catch (error) {
      // Geocoding failed (API not enabled or quota exceeded) - use coordinates
      console.error("Geocoding failed. Please enable the Geocoding API in Google Cloud Console:", error);
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddressText(fallbackAddress);
      onChange({ address: fallbackAddress, latitude: lat, longitude: lng });
    }
  }, [onChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || "";

      setMarkerPosition({ lat, lng });
      setAddressText(address);
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(17);

      onChange({ address, latitude: lat, longitude: lng });
    }
  }, [onChange]);

  if (loadError) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 rounded-lg text-red-600 text-sm">
        Failed to load Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg animate-pulse h-[350px]">
        <div className="h-full flex items-center justify-center text-gray-400">
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        options={{}}
      >
        <input
          type="text"
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          defaultValue={addressText}
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={markerPosition || defaultCenter}
        zoom={markerPosition ? 17 : 12}
        onClick={onMapClick}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>

      {addressText && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <span className="font-medium">Selected address: </span>
          {addressText}
        </div>
      )}
    </div>
  );
}
