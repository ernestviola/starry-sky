const starBundleRequests = new Map();
let constellationCatalogRequest;

const fetchGzipJson = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load static catalog: ${path}`);

  const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(decompressed).json();
};

export const loadStarFrameBundle = (bundleId) => {
  if (!starBundleRequests.has(bundleId)) {
    const request = fetchGzipJson(`/data/stars/region-${bundleId}.json.gz`).catch((error) => {
      starBundleRequests.delete(bundleId);
      throw error;
    });
    starBundleRequests.set(bundleId, request);
  }

  return starBundleRequests.get(bundleId);
};

export const loadConstellationCatalog = () => {
  if (!constellationCatalogRequest) {
    constellationCatalogRequest = fetchGzipJson(
      '/data/constellations/catalog.json.gz',
    ).catch((error) => {
      constellationCatalogRequest = undefined;
      throw error;
    });
  }

  return constellationCatalogRequest;
};
