/** A file to upload. Compatible with React Native's ImagePicker and DocumentPicker result shapes. */
export interface UploadFile {
  /** Local file URI (e.g. 'file:///path/to/image.jpg'). */
  uri: string
  /** MIME type (e.g. 'image/jpeg', 'application/pdf'). */
  mimeType: string
  /** File name (e.g. 'photo.jpg'). */
  name: string
  /** File size in bytes. */
  size?: number
}

/** Upload progress event. */
export interface UploadProgress {
  /** Bytes transferred so far. */
  loaded: number
  /** Total bytes to transfer (0 if unknown). */
  total: number
  /** Progress 0–1 (null if total is unknown). */
  percent: number | null
}

/** Server response from the presign endpoint. */
export interface PresignedUploadResponse {
  /** The presigned URL to PUT the file to. */
  uploadUrl: string
  /** The final public/CDN URL of the file after upload. */
  fileUrl: string
  /** Any additional fields to include in the PUT request (e.g. S3 form fields). */
  fields?: Record<string, string>
  /** Expiry in seconds. */
  expiresIn?: number
}

/** Result of a completed upload. */
export interface UploadResult {
  /** Final URL of the uploaded file (from the server or presigned response). */
  fileUrl: string
  /** The file that was uploaded. */
  file: UploadFile
  /** Server metadata returned after upload confirmation (if any). */
  metadata?: Record<string, unknown>
}

/** Options for presigned upload. */
export interface PresignedUploadOptions {
  /** Backend endpoint to get the presigned URL. Default: '/upload/presign'. */
  presignEndpoint?: string
  /** Additional fields to send in the presign request. */
  presignBody?: Record<string, unknown>
  /** Called on upload progress. */
  onProgress?: (progress: UploadProgress) => void
}

/** Options for direct upload. */
export interface DirectUploadOptions {
  /** Backend endpoint for the multipart upload. Default: '/upload'. */
  endpoint?: string
  /** Additional form fields to include. */
  fields?: Record<string, string>
  /** Called on upload progress. */
  onProgress?: (progress: UploadProgress) => void
}
