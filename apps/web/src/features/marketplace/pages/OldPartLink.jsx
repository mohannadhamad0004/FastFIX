import { Navigate, useParams } from 'react-router'

// Part pages used to live at /marketplace/parts/:partId; old links go to /marketplace/part/:partId.
export default function OldPartLink() {
  const { partId } = useParams()
  return <Navigate to={`/marketplace/part/${partId}`} replace />
}
