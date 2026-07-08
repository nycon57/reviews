export function getOsmTileUrl(latitude: number, longitude: number, zoom = 15) {
  const latRad = (latitude * Math.PI) / 180;
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const y = Math.floor(
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2) *
      scale
  );

  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}
