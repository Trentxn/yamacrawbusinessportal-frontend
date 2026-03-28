import client from './client'

export interface UploadResponse {
  id: string
  url: string
}

export const uploadsApi = {
  uploadImage(file: File, uploadType: 'logo' | 'photo' = 'photo') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_type', uploadType)
    return client.post<UploadResponse>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteUpload(id: string) {
    return client.delete(`/uploads/${id}`)
  },
}
