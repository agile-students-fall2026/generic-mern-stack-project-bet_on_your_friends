// sends requests to Express back-end
// vite forwards every /api request to localhost:3000

// send a request and return the JSON the back-end sends back
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const options = { method, headers: {} }

  // send any data as a JSON
  if (body !== undefined) {
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
  if (!response.ok) {
    throw new Error(data?.error || 'Something went wrong. Please try again.')
  }

  return data
}
