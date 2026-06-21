// Lightweight analytics hook — tracks feature usage, no personal data
const track = (name, props = {}) => {
  try {
    window.api?.track(name, props)
  } catch(e) {}
}

export default track
