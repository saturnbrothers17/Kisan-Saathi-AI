/**
 * Camera Capture Component
 * Handles camera access and image capture functionality
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, VideoOff, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture: (dataUri: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setIsCameraLoading(true);
    stopCameraStream();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    } finally {
      setIsCameraLoading(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        onCapture(dataUri);
        toast({
          title: 'Image Captured',
          description: 'Plant image captured successfully!',
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-full aspect-video rounded-lg border bg-muted/50 overflow-hidden flex items-center justify-center">
        {isCameraLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin" />
            <span>Starting Camera...</span>
          </div>
        ) : hasCameraPermission === true ? (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground p-4 text-center">
            <VideoOff className="h-12 w-12" />
            <span className="font-semibold">Camera Access Required</span>
            <span className="text-sm">Please enable camera permissions to capture plant images</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={startCamera}
          disabled={isCameraLoading || hasCameraPermission === true}
          variant="outline"
          size="sm"
        >
          {isCameraLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {hasCameraPermission === true ? 'Camera Active' : 'Start Camera'}
        </Button>
        <Button
          onClick={captureImage}
          disabled={!hasCameraPermission || isCameraLoading}
          size="sm"
        >
          <Zap className="mr-2 h-4 w-4" />
          Capture
        </Button>
      </div>
    </div>
  );
}
