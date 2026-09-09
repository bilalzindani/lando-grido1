/**
 * Every asset path is built from this one constant.
 *
 * The artwork ships **in this repository**, served from the same origin as the
 * page. It was originally fetched from a third-party bucket, and that bucket
 * was renamed under us mid-deploy (`lando-04a9449ab2` became
 * `kimi-04a9449ab2`), which took every image, texture and the model down at
 * once. A page whose subject lives on someone else's URL is one rename away
 * from being blank, so the files are vendored and this points at ourselves.
 *
 * Same-origin also means no CORS to negotiate: three's loaders still request
 * anonymously, which is fine, and nothing depends on a remote host's headers.
 */
export const ASSET_BASE_URL = "assets";
export const asset = (path: string) => `${ASSET_BASE_URL}/${path}`;
