import request from './request';

export interface UploadResult {
  url: string;
  filename: string;
}

export const apiUpload = (file: File): Promise<UploadResult> => {
  const form = new FormData();
  form.append('file', file);
  return request.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
