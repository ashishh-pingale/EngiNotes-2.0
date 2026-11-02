const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "p7mrldyo";
const NOTE_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "enginotes_uploads";
const PROFILE_PRESET = import.meta.env.VITE_CLOUDINARY_PROFILE_UPLOAD_PRESET || "enginotes_profile_uploads";

export async function uploadNotePdf(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", NOTE_PRESET);

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url || data.url);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || "Cloudinary upload failed"));
        } catch {
          reject(new Error("Cloudinary upload failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(formData);
  });
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", PROFILE_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to upload profile picture");
  }

  const data = await res.json();
  return data.secure_url || data.url;
}
