import { useEffect, useState } from 'react'

// Temporary URL for showing a File or Blob (e.g. <img src>). The URL is released when the file
// changes or the component unmounts. Returns null until the URL is ready.
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    const next = file ? URL.createObjectURL(file) : null
    // The URL is an external resource: it has to be created and released in the same effect
    // (a useMemo URL would be revoked by StrictMode's test unmount and never recreated).
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(next)
    return next ? () => URL.revokeObjectURL(next) : undefined
  }, [file])

  return url
}
