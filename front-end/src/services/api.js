// sends requests to Express back-end
// vite forwards every /api and /uploads request to localhost:3000

// send a request and return the JSON the back-end sends back
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const options = { method, headers: {} }

  // send files as form data and any other data as JSON
  if (body instanceof FormData) {
    options.body = body
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(path, options)
  } catch {
    // fetch fails when the back-end can't be reached
    throw new Error('Could not reach the server. Please try again.')
  }

  // read the JSON body
  const data = await response.json().catch(() => null)

  // 400 and 500 errors
  // keep the status code so pages can handle errors (like 404) differently
  if (!response.ok) {
    const error = new Error(data?.error || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return data
}

// image types and size the back-end accepts for uploads
const imageTypes = ['image/png', 'image/jpeg']
const maxImageSize = 5 * 1024 * 1024

// upload an image file and return the URL back-end serves it from
export async function uploadImage(file) {
  // check file first so an invalid file is never sent to back-end
  if (!imageTypes.includes(file.type)) {
    throw new Error('Please choose a PNG or JPEG image.')
  }

  if (file.size > maxImageSize) {
    throw new Error('Images must be 5 MB or smaller.')
  }

  const formData = new FormData()

  formData.append('image', file)

  const { url } = await apiRequest('/api/uploads', { method: 'POST', body: formData })

  return url
}

// show default picture if an uploaded image is broken
export function showFallbackPhoto(fallbackUrl) {
  return (event) => {
    if (event.currentTarget.src !== fallbackUrl) event.currentTarget.src = fallbackUrl
  }
}
