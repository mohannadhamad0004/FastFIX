import { useObjectUrl } from '../hooks/useObjectUrl.js'

// <img> for an uploaded File (profile photos, logos, gallery photos). Renders nothing until the
// file's URL is ready, and nothing when there is no file.
export default function FileImage({ file, alt, ...imgProps }) {
  const url = useObjectUrl(file)
  if (!url) return null
  return <img src={url} alt={alt} {...imgProps} />
}
