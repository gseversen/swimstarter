const PATH_COLOR = "#FF0000";
const PATH_WIDTH = 2.5;

/**
 * Draw a landmark path as a polyline on the canvas, only up to currentTime.
 * The full series is precomputed; we just draw the portion that has "happened" so far.
 * Coordinates in pathSeries are normalized (0–1); scaled to canvas dimensions.
 */
export function drawLandmarkPath(ctx, width, height, pathSeries, currentTime) {
  if (!pathSeries || pathSeries.length < 2) return;

  // Find the last point at or before currentTime
  let end = 0;
  if (currentTime == null) {
    end = pathSeries.length - 1;
  } else {
    for (let i = 0; i < pathSeries.length; i++) {
      if (pathSeries[i].t <= currentTime) end = i;
      else break;
    }
  }

  if (end < 1) return;

  ctx.strokeStyle = PATH_COLOR;
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(pathSeries[0].x * width, pathSeries[0].y * height);

  for (let i = 1; i <= end; i++) {
    ctx.lineTo(pathSeries[i].x * width, pathSeries[i].y * height);
  }
  ctx.stroke();
}
