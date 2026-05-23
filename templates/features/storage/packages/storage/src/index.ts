export type UploadedObject = {
  key: string;
  url: string;
};

export function buildObjectUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\\/+$/, "")}/${key.replace(/^\\/+/, "")}`;
}

