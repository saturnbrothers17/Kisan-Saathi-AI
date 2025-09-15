// GPS Field Boundary Mapping for Farmers
// Real-time field boundary detection and management system

export interface FieldBoundary {
  fieldId: string;
  farmerId: string;
  fieldName: string;
  coordinates: Array<{ lat: number; lon: number; elevation?: number }>;
  area: number; // hectares
  perimeter: number; // meters
  centerPoint: { lat: number; lon: number };
  cropType?: string;
  soilType?: string;
  irrigationType?: string;
  createdDate: string;
  lastUpdated: string;
  accuracy: number; // GPS accuracy in meters
  source: 'gps_walk' | 'drone_survey' | 'satellite_trace' | 'manual_input';
}

export interface GPSPoint {
  lat: number;
  lon: number;
  elevation?: number;
  timestamp: string;
  accuracy: number; // meters
  speed?: number; // m/s
  heading?: number; // degrees
}

export interface FieldMappingSession {
  sessionId: string;
  fieldId: string;
  farmerId: string;
  startTime: string;
  endTime?: string;
  gpsPoints: GPSPoint[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  mappingMethod: 'boundary_walk' | 'corner_points' | 'center_radius';
  deviceInfo: {
    deviceId: string;
    gpsAccuracy: number;
    batteryLevel: number;
  };
}

export interface FieldZone {
  zoneId: string;
  fieldId: string;
  zoneName: string;
  coordinates: Array<{ lat: number; lon: number }>;
  zoneType: 'irrigation' | 'soil_type' | 'crop_variety' | 'problem_area' | 'equipment_path';
  properties: { [key: string]: any };
  area: number; // hectares
}

// GPS Field Mapping Service
export class GPSFieldMapper {
  private activeSessions: Map<string, FieldMappingSession> = new Map();
  private fields: Map<string, FieldBoundary> = new Map();
  private watchId: number | null = null;

  async startBoundaryMapping(
    fieldId: string,
    farmerId: string,
    fieldName: string,
    method: 'boundary_walk' | 'corner_points' | 'center_radius' = 'boundary_walk'
  ): Promise<string> {
    const sessionId = `mapping_${Date.now()}`;
    
    const session: FieldMappingSession = {
      sessionId,
      fieldId,
      farmerId,
      startTime: new Date().toISOString(),
      gpsPoints: [],
      status: 'active',
      mappingMethod: method,
      deviceInfo: {
        deviceId: this.getDeviceId(),
        gpsAccuracy: 0,
        batteryLevel: await this.getBatteryLevel()
      }
    };

    this.activeSessions.set(sessionId, session);
    
    // Start GPS tracking
    await this.startGPSTracking(sessionId);
    
    console.log(`🗺️ Started field mapping session: ${sessionId} for field: ${fieldName}`);
    return sessionId;
  }

  private async startGPSTracking(sessionId: string): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('GPS not available on this device');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleGPSUpdate(sessionId, position),
      (error) => this.handleGPSError(sessionId, error),
      options
    );
  }

  private handleGPSUpdate(sessionId: string, position: GeolocationPosition): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') return;

    const gpsPoint: GPSPoint = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      elevation: position.coords.altitude || undefined,
      timestamp: new Date().toISOString(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    session.gpsPoints.push(gpsPoint);
    session.deviceInfo.gpsAccuracy = position.coords.accuracy;

    // Auto-save every 10 points
    if (session.gpsPoints.length % 10 === 0) {
      this.saveSessionProgress(sessionId);
    }

    console.log(`📍 GPS point recorded: ${gpsPoint.lat.toFixed(6)}, ${gpsPoint.lon.toFixed(6)} (±${gpsPoint.accuracy}m)`);
  }

  private handleGPSError(sessionId: string, error: GeolocationPositionError): void {
    console.error(`GPS error for session ${sessionId}:`, error.message);
    
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Don't stop the session, just log the error
      // Farmers might temporarily lose GPS signal
    }
  }

  async pauseMapping(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'paused';
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    console.log(`⏸️ Paused mapping session: ${sessionId}`);
  }

  async resumeMapping(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'active';
    await this.startGPSTracking(sessionId);

    console.log(`▶️ Resumed mapping session: ${sessionId}`);
  }

  async completeBoundaryMapping(sessionId: string, fieldName: string): Promise<FieldBoundary> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Stop GPS tracking
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();

    // Process GPS points into field boundary
    const boundary = await this.processGPSPoints(session, fieldName);
    
    // Save the field
    this.fields.set(boundary.fieldId, boundary);
    
    // Clean up session
    this.activeSessions.delete(sessionId);

    console.log(`✅ Completed field mapping: ${boundary.fieldName} (${boundary.area.toFixed(2)} hectares)`);
    return boundary;
  }

  private async processGPSPoints(session: FieldMappingSession, fieldName: string): Promise<FieldBoundary> {
    const points = session.gpsPoints;
    
    if (points.length < 3) {
      throw new Error('Need at least 3 GPS points to create a field boundary');
    }

    let coordinates: Array<{ lat: number; lon: number; elevation?: number }>;

    switch (session.mappingMethod) {
      case 'boundary_walk':
        coordinates = this.processBoundaryWalk(points);
        break;
      case 'corner_points':
        coordinates = this.processCornerPoints(points);
        break;
      case 'center_radius':
        coordinates = this.processCenterRadius(points);
        break;
      default:
        coordinates = points.map(p => ({ lat: p.lat, lon: p.lon, elevation: p.elevation }));
    }

    // Ensure the boundary is closed
    if (coordinates.length > 0) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      const distance = this.calculateDistance(first.lat, first.lon, last.lat, last.lon);
      
      if (distance > 10) { // If more than 10m apart, close the boundary
        coordinates.push({ ...first });
      }
    }

    const area = this.calculateArea(coordinates);
    const perimeter = this.calculatePerimeter(coordinates);
    const centerPoint = this.calculateCenterPoint(coordinates);
    const averageAccuracy = points.reduce((sum, p) => sum + p.accuracy, 0) / points.length;

    return {
      fieldId: session.fieldId,
      farmerId: session.farmerId,
      fieldName,
      coordinates,
      area,
      perimeter,
      centerPoint,
      createdDate: session.startTime,
      lastUpdated: new Date().toISOString(),
      accuracy: averageAccuracy,
      source: 'gps_walk'
    };
  }

  private processBoundaryWalk(points: GPSPoint[]): Array<{ lat: number; lon: number; elevation?: number }> {
    // Filter out points that are too close together (< 2 meters)
    const filtered: GPSPoint[] = [];
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        filtered.push(points[i]);
        continue;
      }
      
      const prev = filtered[filtered.length - 1];
      const distance = this.calculateDistance(prev.lat, prev.lon, points[i].lat, points[i].lon);
      
      if (distance >= 2) { // Only keep points at least 2m apart
        filtered.push(points[i]);
      }
    }

    return filtered.map(p => ({ lat: p.lat, lon: p.lon, elevation: p.elevation }));
  }

  private processCornerPoints(points: GPSPoint[]): Array<{ lat: number; lon: number; elevation?: number }> {
    // For corner points method, use all points as they represent field corners
    return points.map(p => ({ lat: p.lat, lon: p.lon, elevation: p.elevation }));
  }

  private processCenterRadius(points: GPSPoint[]): Array<{ lat: number; lon: number; elevation?: number }> {
    if (points.length < 2) throw new Error('Need center point and radius point');
    
    const center = points[0];
    const radiusPoint = points[1];
    const radius = this.calculateDistance(center.lat, center.lon, radiusPoint.lat, radiusPoint.lon);
    
    // Create circular boundary
    const coordinates: Array<{ lat: number; lon: number }> = [];
    const numPoints = 36; // 10-degree intervals
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 360 / numPoints) * Math.PI / 180;
      const lat = center.lat + (radius / 111320) * Math.cos(angle);
      const lon = center.lon + (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push({ lat, lon });
    }
    
    return coordinates;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateArea(coordinates: Array<{ lat: number; lon: number }>): number {
    if (coordinates.length < 3) return 0;
    
    // Use the shoelace formula for polygon area
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lon;
      area -= coordinates[j].lat * coordinates[i].lon;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from square degrees to hectares
    // Approximate conversion at mid-latitudes
    const avgLat = coordinates.reduce((sum, p) => sum + p.lat, 0) / n;
    const latFactor = 111320; // meters per degree latitude
    const lonFactor = 111320 * Math.cos(avgLat * Math.PI / 180); // meters per degree longitude
    
    const areaM2 = area * latFactor * lonFactor;
    return areaM2 / 10000; // Convert to hectares
  }

  private calculatePerimeter(coordinates: Array<{ lat: number; lon: number }>): number {
    let perimeter = 0;
    
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      perimeter += this.calculateDistance(
        coordinates[i].lat, coordinates[i].lon,
        coordinates[j].lat, coordinates[j].lon
      );
    }
    
    return perimeter;
  }

  private calculateCenterPoint(coordinates: Array<{ lat: number; lon: number }>): { lat: number; lon: number } {
    const lat = coordinates.reduce((sum, p) => sum + p.lat, 0) / coordinates.length;
    const lon = coordinates.reduce((sum, p) => sum + p.lon, 0) / coordinates.length;
    return { lat, lon };
  }

  private getDeviceId(): string {
    // Generate or retrieve device ID
    let deviceId = localStorage.getItem('kisan_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kisan_device_id', deviceId);
    }
    return deviceId;
  }

  private async getBatteryLevel(): Promise<number> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      } catch (error) {
        return 100; // Default if battery API not available
      }
    }
    return 100;
  }

  private saveSessionProgress(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      localStorage.setItem(`mapping_session_${sessionId}`, JSON.stringify(session));
    }
  }

  // Public methods for field management
  getField(fieldId: string): FieldBoundary | undefined {
    return this.fields.get(fieldId);
  }

  getAllFields(farmerId: string): FieldBoundary[] {
    return Array.from(this.fields.values()).filter(field => field.farmerId === farmerId);
  }

  updateField(fieldId: string, updates: Partial<FieldBoundary>): void {
    const field = this.fields.get(fieldId);
    if (field) {
      Object.assign(field, updates, { lastUpdated: new Date().toISOString() });
      this.fields.set(fieldId, field);
    }
  }

  deleteField(fieldId: string): boolean {
    return this.fields.delete(fieldId);
  }

  getActiveSession(sessionId: string): FieldMappingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getAllActiveSessions(): FieldMappingSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Field zone management
  async createFieldZone(
    fieldId: string,
    zoneName: string,
    zoneType: FieldZone['zoneType'],
    coordinates: Array<{ lat: number; lon: number }>,
    properties: { [key: string]: any } = {}
  ): Promise<FieldZone> {
    const zoneId = `zone_${fieldId}_${Date.now()}`;
    const area = this.calculateArea(coordinates);

    const zone: FieldZone = {
      zoneId,
      fieldId,
      zoneName,
      coordinates,
      zoneType,
      properties,
      area
    };

    // Store zone (in production, this would go to a database)
    const fieldZones = this.getFieldZones(fieldId);
    fieldZones.push(zone);
    localStorage.setItem(`field_zones_${fieldId}`, JSON.stringify(fieldZones));

    console.log(`🎯 Created field zone: ${zoneName} (${area.toFixed(2)} hectares)`);
    return zone;
  }

  getFieldZones(fieldId: string): FieldZone[] {
    const stored = localStorage.getItem(`field_zones_${fieldId}`);
    return stored ? JSON.parse(stored) : [];
  }

  // Export field data
  exportFieldData(fieldId: string): any {
    const field = this.fields.get(fieldId);
    if (!field) return null;

    const zones = this.getFieldZones(fieldId);

    return {
      field,
      zones,
      exportDate: new Date().toISOString(),
      format: 'GeoJSON',
      geoJson: this.convertToGeoJSON(field, zones)
    };
  }

  private convertToGeoJSON(field: FieldBoundary, zones: FieldZone[]): any {
    const features = [];

    // Add field boundary
    features.push({
      type: 'Feature',
      properties: {
        type: 'field_boundary',
        fieldId: field.fieldId,
        fieldName: field.fieldName,
        area: field.area,
        cropType: field.cropType
      },
      geometry: {
        type: 'Polygon',
        coordinates: [field.coordinates.map(c => [c.lon, c.lat])]
      }
    });

    // Add zones
    zones.forEach(zone => {
      features.push({
        type: 'Feature',
        properties: {
          type: 'field_zone',
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          zoneType: zone.zoneType,
          area: zone.area,
          ...zone.properties
        },
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates.map(c => [c.lon, c.lat])]
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }
}

// Singleton instance for global use
export const fieldMapper = new GPSFieldMapper();
