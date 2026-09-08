/** Every asset path is built from this one constant. */
export const ASSET_BASE_URL =
  "https://storage.getlayers.ai/assets/lando-04a9449ab2";
export const asset = (path: string) => `${ASSET_BASE_URL}/${path}`;
