interface Props {
  imageUrl: string
  onClose: () => void
}

const ImageViewerModal = ({ imageUrl, onClose }: Props) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-image" onClick={(e) => e.stopPropagation()}>
        <div className="image-viewer-header">
          <h2 className="image-viewer-title">Meter Photo</h2>
          <button className="image-viewer-close" type="button" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="image-viewer-content">
          <img src={imageUrl} alt="Meter reading" className="meter-image" />
        </div>
      </div>
    </div>
  )
}

export default ImageViewerModal

