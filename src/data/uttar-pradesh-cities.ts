/**
 * Comprehensive database of Uttar Pradesh cities with coordinates
 * Includes all major cities, districts, and important towns
 */

export interface UPCity {
  name: string;
  district: string;
  lat: number;
  lon: number;
  population?: number;
  type: 'metro' | 'city' | 'town' | 'village';
}

export const uttarPradeshCities: UPCity[] = [
  // Metro Cities
  { name: 'Lucknow', district: 'Lucknow', lat: 26.8467, lon: 80.9462, population: 2901474, type: 'metro' },
  { name: 'Kanpur', district: 'Kanpur Nagar', lat: 26.4499, lon: 80.3319, population: 2767031, type: 'metro' },
  { name: 'Ghaziabad', district: 'Ghaziabad', lat: 28.6692, lon: 77.4538, population: 1729000, type: 'metro' },
  { name: 'Agra', district: 'Agra', lat: 27.1767, lon: 78.0081, population: 1585704, type: 'metro' },
  { name: 'Varanasi', district: 'Varanasi', lat: 25.3176, lon: 82.9739, population: 1201815, type: 'metro' },
  { name: 'Meerut', district: 'Meerut', lat: 28.9845, lon: 77.7064, population: 1305429, type: 'metro' },
  { name: 'Allahabad (Prayagraj)', district: 'Prayagraj', lat: 25.4358, lon: 81.8463, population: 1117094, type: 'metro' },

  // Major Cities
  { name: 'Bareilly', district: 'Bareilly', lat: 28.3670, lon: 79.4304, population: 903668, type: 'city' },
  { name: 'Aligarh', district: 'Aligarh', lat: 27.8974, lon: 78.0880, population: 874408, type: 'city' },
  { name: 'Moradabad', district: 'Moradabad', lat: 28.8386, lon: 78.7733, population: 889810, type: 'city' },
  { name: 'Saharanpur', district: 'Saharanpur', lat: 29.9680, lon: 77.5552, population: 703345, type: 'city' },
  { name: 'Gorakhpur', district: 'Gorakhpur', lat: 26.7606, lon: 83.3732, population: 673446, type: 'city' },
  { name: 'Noida', district: 'Gautam Buddha Nagar', lat: 28.5355, lon: 77.3910, population: 642381, type: 'city' },
  { name: 'Firozabad', district: 'Firozabad', lat: 27.1592, lon: 78.3957, population: 603797, type: 'city' },
  { name: 'Jhansi', district: 'Jhansi', lat: 25.4484, lon: 78.5685, population: 507293, type: 'city' },
  { name: 'Muzaffarnagar', district: 'Muzaffarnagar', lat: 29.4727, lon: 77.7085, population: 392451, type: 'city' },
  { name: 'Mathura', district: 'Mathura', lat: 27.4924, lon: 77.6737, population: 441894, type: 'city' },
  { name: 'Rampur', district: 'Rampur', lat: 28.8155, lon: 79.0256, population: 335313, type: 'city' },
  { name: 'Shahjahanpur', district: 'Shahjahanpur', lat: 27.8831, lon: 79.9103, population: 349816, type: 'city' },
  { name: 'Farrukhabad', district: 'Farrukhabad', lat: 27.3929, lon: 79.5801, population: 291077, type: 'city' },
  { name: 'Mau', district: 'Mau', lat: 25.9420, lon: 83.5615, population: 276054, type: 'city' },
  { name: 'Hapur', district: 'Hapur', lat: 28.7306, lon: 77.7759, population: 293454, type: 'city' },
  { name: 'Etawah', district: 'Etawah', lat: 26.7751, lon: 79.0154, population: 256838, type: 'city' },
  { name: 'Mirzapur', district: 'Mirzapur', lat: 25.1460, lon: 82.5690, population: 233691, type: 'city' },
  { name: 'Bulandshahr', district: 'Bulandshahr', lat: 28.4089, lon: 77.8498, population: 235310, type: 'city' },
  { name: 'Sambhal', district: 'Sambhal', lat: 28.5850, lon: 78.5533, population: 220813, type: 'city' },
  { name: 'Amroha', district: 'Amroha', lat: 28.9034, lon: 78.4676, population: 197471, type: 'city' },
  { name: 'Hardoi', district: 'Hardoi', lat: 27.4167, lon: 80.1333, population: 126134, type: 'city' },
  { name: 'Fatehpur', district: 'Fatehpur', lat: 25.9308, lon: 80.8103, population: 190612, type: 'city' },
  { name: 'Raebareli', district: 'Raebareli', lat: 26.2124, lon: 81.2337, population: 191316, type: 'city' },
  { name: 'Orai', district: 'Jalaun', lat: 25.9900, lon: 79.4500, population: 180575, type: 'city' },
  { name: 'Sitapur', district: 'Sitapur', lat: 27.5669, lon: 80.6777, population: 177351, type: 'city' },
  { name: 'Bahraich', district: 'Bahraich', lat: 27.5743, lon: 81.5943, population: 187012, type: 'city' },
  { name: 'Modinagar', district: 'Ghaziabad', lat: 28.9167, lon: 77.6167, population: 132054, type: 'city' },
  { name: 'Unnao', district: 'Unnao', lat: 26.5464, lon: 80.4879, population: 177732, type: 'city' },
  { name: 'Jaunpur', district: 'Jaunpur', lat: 25.7478, lon: 82.6869, population: 180362, type: 'city' },
  { name: 'Lakhimpur', district: 'Lakhimpur Kheri', lat: 27.9479, lon: 80.7750, population: 138187, type: 'city' },
  { name: 'Hathras', district: 'Hathras', lat: 27.5950, lon: 78.0500, population: 156896, type: 'city' },
  { name: 'Banda', district: 'Banda', lat: 25.4761, lon: 80.3350, population: 152519, type: 'city' },
  { name: 'Pilibhit', district: 'Pilibhit', lat: 28.6315, lon: 79.8040, population: 127134, type: 'city' },
  { name: 'Barabanki', district: 'Barabanki', lat: 26.9254, lon: 81.2047, population: 156670, type: 'city' },
  { name: 'Khurja', district: 'Bulandshahr', lat: 28.2500, lon: 77.8500, population: 118226, type: 'city' },
  { name: 'Gonda', district: 'Gonda', lat: 27.1333, lon: 81.9667, population: 132014, type: 'city' },
  { name: 'Mainpuri', district: 'Mainpuri', lat: 27.2350, lon: 79.0167, population: 121312, type: 'city' },
  { name: 'Lalitpur', district: 'Lalitpur', lat: 24.6900, lon: 78.4100, population: 123722, type: 'city' },
  { name: 'Etah', district: 'Etah', lat: 27.6333, lon: 78.6667, population: 115285, type: 'city' },
  { name: 'Deoria', district: 'Deoria', lat: 26.5024, lon: 83.7791, population: 112084, type: 'city' },
  { name: 'Ujhani', district: 'Budaun', lat: 28.0167, lon: 79.0167, population: 101708, type: 'city' },
  { name: 'Ghazipur', district: 'Ghazipur', lat: 25.5881, lon: 83.5775, population: 110587, type: 'city' },
  { name: 'Sultanpur', district: 'Sultanpur', lat: 26.2617, lon: 82.0736, population: 100065, type: 'city' },
  { name: 'Azamgarh', district: 'Azamgarh', lat: 26.0685, lon: 83.1836, population: 110358, type: 'city' },
  { name: 'Bijnor', district: 'Bijnor', lat: 29.3731, lon: 78.1364, population: 103333, type: 'city' },
  { name: 'Najibabad', district: 'Bijnor', lat: 29.6167, lon: 78.3333, population: 94270, type: 'city' },
  { name: 'Sikandrabad', district: 'Bulandshahr', lat: 28.4500, lon: 77.7000, population: 94845, type: 'city' },
  { name: 'Chandausi', district: 'Sambhal', lat: 28.4500, lon: 78.7833, population: 94381, type: 'city' },
  { name: 'Akbarpur', district: 'Kanpur Dehat', lat: 26.4167, lon: 80.1167, population: 85771, type: 'city' },
  { name: 'Ballia', district: 'Ballia', lat: 25.7522, lon: 84.1522, population: 102226, type: 'city' },
  { name: 'Tanda', district: 'Ambedkar Nagar', lat: 26.5500, lon: 82.6500, population: 88915, type: 'city' },
  { name: 'Greater Noida', district: 'Gautam Buddha Nagar', lat: 28.4744, lon: 77.5040, population: 107676, type: 'city' },
  { name: 'Shikohabad', district: 'Firozabad', lat: 27.1167, lon: 78.5833, population: 92174, type: 'city' },
  { name: 'Shamli', district: 'Shamli', lat: 29.4500, lon: 77.3167, population: 87813, type: 'city' },
  { name: 'Awagarh', district: 'Etah', lat: 27.7333, lon: 78.7333, population: 85395, type: 'city' },
  { name: 'Kasganj', district: 'Kasganj', lat: 27.8167, lon: 78.6500, population: 88433, type: 'city' },

  // Important Towns
  { name: 'Vrindavan', district: 'Mathura', lat: 27.5806, lon: 77.7006, population: 63005, type: 'town' },
  { name: 'Rishikesh', district: 'Dehradun', lat: 30.0869, lon: 78.2676, population: 102138, type: 'town' },
  { name: 'Haridwar', district: 'Haridwar', lat: 29.9457, lon: 78.1642, population: 228832, type: 'town' },
  { name: 'Ayodhya', district: 'Ayodhya', lat: 26.7922, lon: 82.1998, population: 55890, type: 'town' },
  { name: 'Chitrakoot', district: 'Chitrakoot', lat: 25.2000, lon: 80.9167, population: 22294, type: 'town' },
  { name: 'Nainital', district: 'Nainital', lat: 29.3919, lon: 79.4542, population: 41377, type: 'town' },
  { name: 'Almora', district: 'Almora', lat: 29.5971, lon: 79.6593, population: 35513, type: 'town' },
  { name: 'Tehri', district: 'Tehri Garhwal', lat: 30.3783, lon: 78.4803, population: 9937, type: 'town' },
  { name: 'Pauri', district: 'Pauri Garhwal', lat: 30.1500, lon: 78.7833, population: 23124, type: 'town' },
  { name: 'Rudrapur', district: 'Udham Singh Nagar', lat: 28.9845, lon: 79.4104, population: 154485, type: 'town' },
  { name: 'Haldwani', district: 'Nainital', lat: 29.2183, lon: 79.5130, population: 156078, type: 'town' },
  { name: 'Kashipur', district: 'Udham Singh Nagar', lat: 29.2167, lon: 78.9500, population: 121623, type: 'town' },
  { name: 'Roorkee', district: 'Haridwar', lat: 29.8543, lon: 77.8880, population: 118473, type: 'town' },

  // District Headquarters
  { name: 'Basti', district: 'Basti', lat: 26.8167, lon: 82.7333, population: 101011, type: 'city' },
  { name: 'Hamirpur', district: 'Hamirpur', lat: 25.9565, lon: 80.1590, population: 59458, type: 'town' },
  { name: 'Mahoba', district: 'Mahoba', lat: 25.2833, lon: 79.8667, population: 94853, type: 'town' },
  { name: 'Pratapgarh', district: 'Pratapgarh', lat: 25.8961, lon: 81.9461, population: 77292, type: 'town' },
  { name: 'Kaushambi', district: 'Kaushambi', lat: 25.5333, lon: 81.3833, population: 22214, type: 'town' },
  { name: 'Sant Kabir Nagar', district: 'Sant Kabir Nagar', lat: 26.7667, lon: 83.0333, population: 63226, type: 'town' },
  { name: 'Maharajganj', district: 'Maharajganj', lat: 27.1500, lon: 83.5667, population: 54751, type: 'town' },
  { name: 'Kushinagar', district: 'Kushinagar', lat: 26.7417, lon: 83.8889, population: 22214, type: 'town' },
  { name: 'Siddharthnagar', district: 'Siddharthnagar', lat: 27.2833, lon: 83.1167, population: 67583, type: 'town' },
  { name: 'Bhadohi', district: 'Sant Ravidas Nagar', lat: 25.3950, lon: 82.5689, population: 159838, type: 'town' },
  { name: 'Chandauli', district: 'Chandauli', lat: 25.2667, lon: 83.2667, population: 35029, type: 'town' },
  { name: 'Sonbhadra', district: 'Sonbhadra', lat: 24.6833, lon: 83.0667, population: 42701, type: 'town' },
  { name: 'Gazipur', district: 'Ghazipur', lat: 25.5881, lon: 83.5775, population: 110587, type: 'town' },
  { name: 'Jalaun', district: 'Jalaun', lat: 26.1500, lon: 79.3333, population: 34979, type: 'town' },
  { name: 'Auraiya', district: 'Auraiya', lat: 26.4667, lon: 79.5000, population: 78192, type: 'town' },
  { name: 'Kannauj', district: 'Kannauj', lat: 27.0500, lon: 79.9167, population: 84862, type: 'town' },
  { name: 'Kanpur Dehat', district: 'Kanpur Dehat', lat: 26.4500, lon: 80.0167, population: 19410, type: 'town' },
  { name: 'Chitrakoot Dham', district: 'Chitrakoot', lat: 25.2000, lon: 80.9167, population: 22294, type: 'town' },
  { name: 'Shravasti', district: 'Shravasti', lat: 27.5167, lon: 82.0333, population: 21597, type: 'town' },
  { name: 'Sant Ravidas Nagar', district: 'Sant Ravidas Nagar', lat: 25.3950, lon: 82.5689, population: 159838, type: 'town' },
  { name: 'Ambedkar Nagar', district: 'Ambedkar Nagar', lat: 26.4000, lon: 82.7000, population: 38768, type: 'town' }
];

// Helper functions
export const getUPCitiesByType = (type: UPCity['type']) => {
  return uttarPradeshCities.filter(city => city.type === type);
};

export const getUPCitiesByDistrict = (district: string) => {
  return uttarPradeshCities.filter(city => city.district === district);
};

export const searchUPCities = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return uttarPradeshCities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) ||
    city.district.toLowerCase().includes(lowerQuery)
  );
};

export const getUPCityByName = (name: string) => {
  return uttarPradeshCities.find(city => 
    city.name.toLowerCase() === name.toLowerCase()
  );
};

// Get all unique districts
export const getUPDistricts = () => {
  const districts = [...new Set(uttarPradeshCities.map(city => city.district))];
  return districts.sort();
};

// Get major cities (metros and cities only)
export const getMajorUPCities = () => {
  return uttarPradeshCities.filter(city => 
    city.type === 'metro' || city.type === 'city'
  ).sort((a, b) => (b.population || 0) - (a.population || 0));
};
