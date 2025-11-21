import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGeoLocation from '../hooks/useGeoLocation';
import { GeoLocation } from '../types';

interface CameraViewProps {
  onCapture: (imageData: string, location: GeoLocation) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { data: location, loading: locationLoading, getLocation } = useGeoLocation();

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions.');
      }
    };

    getCameraStream();
    getLocation();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (!location) {
      setError('Waiting for location...');
      return;
    }

    if (location.accuracy > 150) {
      setError('Location accuracy too low. Move outdoors.');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      setCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        setTimeout(() => {
          onCapture(dataUrl, location);
          stream?.getTracks().forEach((track) => track.stop());
        }, 300);
      }
    }
  }, [onCapture, location, stream]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="relative w-full h-full">
        {error && !capturing ? (
          <div className="w-full h-full flex items-center justify-center text-white p-4 text-center">
            <div className="space-y-3">
              <p className="text-lg font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-black rounded-full font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <div className="text-white space-y-1">
                  <p className="text-xs uppercase tracking-wider opacity-70">Face Capture</p>
                  <p className="text-sm font-semibold">Position your face in frame</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl"
                  aria-label="Close camera"
                >
                  ×
                </button>
              </div>
            </div>

            <AnimatePresence>
              {location && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-32 left-0 right-0 px-6"
                >
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-12 h-12 rounded-full bg-black flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                          Location Locked
                        </p>
                        <p className="text-sm text-black font-semibold">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Accuracy: {Math.round(location.accuracy)}m
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {capturing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center">
          {locationLoading ? (
            <div className="text-white text-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
              <p className="text-sm">Acquiring location...</p>
            </div>
          ) : (
            <motion.button
              onClick={handleCapture}
              disabled={!location || capturing}
              whileTap={{ scale: 0.9 }}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              aria-label="Capture photo"
            >
              {capturing && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraView;
