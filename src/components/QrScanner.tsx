'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

export default function QrScanner({ onScanSuccess, onScanFailure }: QrScannerProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'qr-reader-region';

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    // Check for cameras on mount
    if (typeof window === 'undefined') return;

    const queryCameras = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          setActiveCameraId(devices[0].id);
        } else {
          setErrorMsg('No cameras found. Please plug in a camera or grant permissions.');
        }
      } catch (e) {
        console.error('Failed to query cameras:', e);
        setErrorMsg('Error requesting camera permissions.');
      }
    };

    queryCameras();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!activeCameraId) return;
    setErrorMsg('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (scannerRef.current) {
        await stopScanning();
      }

      const html5QrCode = new Html5Qrcode(regionId);
      scannerRef.current = html5QrCode;

      setIsScanning(true);

      await html5QrCode.start(
        activeCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Play a simulated scan beep
          try {
            const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
              const context = new AudioContextClass();
              const osc = context.createOscillator();
              const gain = context.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, context.currentTime); // High pitch beep
              gain.gain.setValueAtTime(0.1, context.currentTime);
              osc.connect(gain);
              gain.connect(context.destination);
              osc.start();
              osc.stop(context.currentTime + 0.1);
            }
          } catch (e) {
            console.error('Audio beep failed:', e);
          }

          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanFailure) {
            onScanFailure(errorMessage);
          }
        }
      );
    } catch (e) {
      console.error('Failed to start scanning:', e);
      const err = e as Error;
      setErrorMsg(`Failed to start camera: ${err?.message || err}`);
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Viewport Box */}
      <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center shadow-inner">
        
        {/* Transparent QR Region Container */}
        <div id={regionId} className="w-full h-full object-cover" />

        {/* Animated Scanner Grid Overlay */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Camera className="h-12 w-12 text-gray-500 mb-2 animate-pulse" />
            <p className="text-xs text-gray-400 font-medium">Camera is offline</p>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none border-[3px] border-primary/20 flex items-center justify-center">
            {/* Target Crosshairs */}
            <div className="w-[200px] h-[200px] border border-primary/50 rounded-xl relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
              {/* Laser Line */}
              <div className="absolute left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce" style={{ top: '50%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-[320px] mt-4 space-y-3">
        {/* Device Select */}
        {cameras.length > 1 && !isScanning && (
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Select Camera Device</label>
            <select
              value={activeCameraId}
              onChange={(e) => setActiveCameraId(e.target.value)}
              className="w-full glass-input text-xs py-2 px-3"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id} className="bg-background text-white">
                  {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start / Stop Toggle Button */}
        {isScanning ? (
          <button
            onClick={stopScanning}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-danger hover:bg-danger/90 text-white text-xs shadow-md shadow-danger/20 transition-all hover:scale-[1.01]"
          >
            <CameraOff className="h-4 w-4" /> Stop Camera Scanner
          </button>
        ) : (
          <button
            onClick={startScanning}
            disabled={cameras.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
          >
            <Camera className="h-4 w-4" /> Start Camera Scanner
          </button>
        )}

        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-2 text-danger text-xs leading-normal">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
