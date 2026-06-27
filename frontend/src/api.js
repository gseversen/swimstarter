const API_BASE_URL = "http://127.0.0.1:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchWelcomeMessage() {
  const response = await fetch(`${API_BASE_URL}/`);
  return handleResponse(response);
}

export async function analyzeFrame(imageBlob, waterLine) {
  const formData = new FormData();
  formData.append("image", imageBlob, "frame.jpg");
  formData.append("water_line", String(waterLine));

  const response = await fetch(`${API_BASE_URL}/analyze-frame`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

export async function searchVideos({ genre, stroke } = {}) {
  const params = new URLSearchParams();
  if (genre) params.set("genre", genre);
  if (stroke) params.set("stroke", stroke);

  const queryString = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/search/${queryString ? `?${queryString}` : ""}`,
  );

  return handleResponse(response);
}
