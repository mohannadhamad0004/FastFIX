import { useCallback, useMemo, useState } from 'react'
import { defaultTransform, getAccessoryData } from './accessoryData.js'
import { findReadyModel, findReadyModelById } from './carModels.js'
import { Preview3DContext } from './Preview3DContext.js'

// Holds the 3D preview for the whole app (see Preview3DContext.js).
// Parts are kept as snapshots of what the user added.
export default function Preview3DProvider({ children }) {
  const [source, setSource] = useState(null)
  const [car, setCarState] = useState(null)
  const [closestModelId, setClosestModelId] = useState(null)
  const [scanId, setScanId] = useState(null)
  const [scanCarId, setScanCarId] = useState(null) // the car a new scan is for (from My Cars)
  const [items, setItems] = useState([])
  const [transforms, setTransforms] = useState({})
  const [isOpen, setIsOpen] = useState(false)

  const readyModel = closestModelId ? findReadyModelById(closestModelId) : findReadyModel(car)

  const setCar = useCallback((next) => {
    setCarState(next)
    setClosestModelId(null)
  }, [])

  const chooseSource = useCallback((next) => {
    setSource(next)
    setScanId(null)
    setClosestModelId(null)
  }, [])

  // A ready or failed scan the customer picked; its car becomes the car parts are checked against.
  const selectScan = useCallback((scan) => {
    setSource('scan')
    setScanId(scan?.id ?? null)
    if (scan) setCarState({ make: scan.car.make, model: scan.car.model, year: scan.car.year })
  }, [])

  // From My Cars: open the drawer on the scan flow, for that car.
  const startScan = useCallback((carId) => {
    setSource('scan')
    setScanId(null)
    setScanCarId(carId)
    setIsOpen(true)
  }, [])

  // On a ready model, a part takes its attachment point: a part already on that point is removed
  // (two wheel sets can't both be on the front wheels). Free parts and scanned cars never replace.
  const addPart = useCallback(
    (part) => {
      if (items.some((p) => p.id === part.id)) return null
      const { placementType, attachmentAnchor } = getAccessoryData(part)
      const replaced =
        source !== 'scan' && placementType === 'anchor'
          ? (items.find((p) => {
              const other = getAccessoryData(p)
              return other.placementType === 'anchor' && other.attachmentAnchor === attachmentAnchor
            }) ?? null)
          : null
      setItems((current) => [...current.filter((p) => p.id !== replaced?.id), part])
      setTransforms((current) => ({ ...current, [part.id]: defaultTransform(part) }))
      return replaced
    },
    [items, source],
  )

  const removePart = useCallback((partId) => {
    setItems((current) => current.filter((p) => p.id !== partId))
    setTransforms(({ [partId]: _removed, ...rest }) => rest)
  }, [])

  const updateTransform = useCallback(
    (partId, changes) => setTransforms((current) => ({ ...current, [partId]: { ...current[partId], ...changes } })),
    [],
  )

  // "Reset": every accessory off the car.
  const resetPreview = useCallback(() => {
    setItems([])
    setTransforms({})
  }, [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({
      source,
      car,
      readyModel,
      usingClosestModel: Boolean(closestModelId),
      scanId,
      scanCarId,
      items,
      transforms,
      isOpen,
      chooseSource,
      setCar,
      chooseClosestModel: setClosestModelId,
      selectScan,
      startScan,
      addPart,
      removePart,
      isSelected: (partId) => items.some((p) => p.id === partId),
      updateTransform,
      resetPreview,
      open,
      close,
    }),
    [
      source,
      car,
      readyModel,
      closestModelId,
      scanId,
      scanCarId,
      items,
      transforms,
      isOpen,
      chooseSource,
      setCar,
      selectScan,
      startScan,
      addPart,
      removePart,
      updateTransform,
      resetPreview,
      open,
      close,
    ],
  )

  return <Preview3DContext value={value}>{children}</Preview3DContext>
}
