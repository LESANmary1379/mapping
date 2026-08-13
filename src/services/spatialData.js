// Spatial Data Services: GBIF, OpenAlex, Nominatim, and EMBL-EBI MGnify (Metagenomics)

// 1. Geocode location name to Lat/Lng
export async function searchLocation(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
}

// 2. Fetch species near coordinates (GBIF API)
export async function fetchSpecies(lat, lng) {
  try {
    const latMin = lat - 1;
    const latMax = lat + 1;
    const lngMin = lng - 1;
    const lngMax = lng + 1;

    const response = await fetch(
      `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${latMin},${latMax}&decimalLongitude=${lngMin},${lngMax}&hasCoordinate=true&limit=15`
    );
    const data = await response.json();
    
    return data.results.map((item) => ({
      id: item.key,
      name: item.scientificName || 'Unknown Name',
      species: item.species || 'Unidentified Species',
      lat: item.decimalLatitude,
      lng: item.decimalLongitude,
      media: item.media?.[0]?.identifier || null,
      type: 'species'
    }));
  } catch (error) {
    console.error("Error fetching GBIF data:", error);
    return [];
  }
}

// 3. Fetch scientific research papers (OpenAlex API)
export async function fetchPapers(keyword) {
  try {
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(keyword)}&per_page=10`
    );
    const data = await response.json();

    return data.results.map((item) => ({
      id: item.id,
      title: item.title || 'Untitled Paper',
      author: item.authorships?.[0]?.author?.display_name || 'Unknown Author',
      doi: item.doi,
      year: item.publication_year,
      type: 'paper'
    }));
  } catch (error) {
    console.error("Error fetching OpenAlex data:", error);
    return [];
  }
}

// 4. Fetch metagenomics & microbial samples (EMBL-EBI MGnify API)
export async function fetchMicrobialSamples(lat, lng) {
  try {
    const response = await fetch(
      `https://www.ebi.ac.uk/metagenomics/api/v1/samples?latitude_gte=${lat - 2}&latitude_lte=${lat + 2}&longitude_gte=${lng - 2}&longitude_lte=${lng + 2}&page_size=10`
    );
    const data = await response.json();

    if (!data.data) return [];

    return data.data.map((item) => ({
      id: item.id,
      sampleName: item.attributes['sample-name'] || item.id,
      biome: item.attributes['environment-biome'] || 'Aquatic / Terrestrial Ecosystem',
      material: item.attributes['environment-material'] || 'Environmental Sample',
      lat: parseFloat(item.attributes['latitude']),
      lng: parseFloat(item.attributes['longitude'])
    }));
  } catch (error) {
    console.error("Error fetching MGnify data:", error);
    return [];
  }
}