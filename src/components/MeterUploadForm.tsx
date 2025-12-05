import type { FormEvent } from 'react'
import { useState } from 'react'
import { createReadingFromImage, uploadMeterImage } from '../services/readings'
import { extractReadingFromFile } from '../services/ocr'

interface Props {
  flatId: string
  onComplete?: () => void
}

const MeterUploadForm = ({ flatId, onComplete }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [detected, setDetected] = useState<{ value: number | null; confidence: number | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a meter photo.')
      return
    }
    setError(null)
    setMessage(null)
    setUploading(true)
    try {
      const ocr = await extractReadingFromFile(file)
      setDetected(ocr)
      const imageUrl = await uploadMeterImage(flatId, file)
      await createReadingFromImage(flatId, imageUrl, ocr.value, ocr.confidence ?? undefined)
      setMessage(
        `Uploaded. Detected reading: ${ocr.value ?? 'N/A'}${ocr.confidence ? ` (confidence ${ocr.confidence.toFixed(0)}%)` : ''}`,
      )
      setFile(null)
      if (onComplete) onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="file">
          Meter photo
        </label>
        <input
          id="file"
          className="input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="small">Tip: Take a clear, well-lit photo. Mobile camera capture is supported.</p>
      </div>
      <button className="btn btn-primary" type="submit" disabled={uploading}>
        {uploading ? 'Uploading…' : 'Upload & Run OCR'}
      </button>
      {detected ? (
        <div className="pill">
          Detected: {detected.value ?? 'N/A'}{' '}
          {detected.confidence ? `(confidence ${detected.confidence.toFixed(0)}%)` : ''}
        </div>
      ) : null}
      {message ? <div className="status approved">{message}</div> : null}
      {error ? <div className="status rejected">{error}</div> : null}
    </form>
  )
}

export default MeterUploadForm

