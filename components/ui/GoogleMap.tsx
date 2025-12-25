'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface GoogleMapProps {
  address: string;
  className?: string;
  height?: number;
}

export function GoogleMap({ address, className = '', height = 400 }: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const initMap = useCallback((google: typeof window.google) => {
    if (!google?.maps || !mapContainerRef.current || !address) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, geocodeStatus) => {
      if (geocodeStatus === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          if (markerRef.current) {
            markerRef.current.setPosition(location);
          }
        } else {
          mapInstanceRef.current = new google.maps.Map(mapContainerRef.current!, {
            center: location,
            zoom: 17,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });

          markerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: location,
            title: address,
          });
        }

        setStatus('loaded');
      } else {
        setErrorMessage('住所が見つかりませんでした');
        setStatus('error');
      }
    });
  }, [address]);

  useEffect(() => {
    if (!address) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setErrorMessage('Google Maps APIキーが設定されていません');
      setStatus('error');
      return;
    }

    setStatus('loading');

    if (window.google?.maps) {
      initMap(window.google);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkLoaded);
          initMap(window.google);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ja&region=JP`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        initMap(window.google);
      }
    };
    script.onerror = () => {
      setErrorMessage('地図の読み込みに失敗しました');
      setStatus('error');
    };
    document.head.appendChild(script);
  }, [address, initMap]);

  if (status === 'error') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500 text-sm">地図を読み込み中...</p>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
