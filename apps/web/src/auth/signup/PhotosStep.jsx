import FileUpload from '../../components/FileUpload.jsx'
import StepSection from './StepSection.jsx'

// A step that only collects photos (mechanic workshop photos, parts shop photos).
// `field` is the form field holding the File[]; `min` is how many are required.
export default function PhotosStep({ form, setField, errors, field, min, title, intro, label }) {
  return (
    <StepSection title={title} intro={intro}>
      <FileUpload
        id={field}
        label={label}
        hint={`At least ${min} photo${min === 1 ? '' : 's'}. You can add several at once.`}
        kind="image"
        multiple
        value={form[field]}
        onChange={(files) => setField(field, files)}
        error={errors[field]}
      />
    </StepSection>
  )
}
