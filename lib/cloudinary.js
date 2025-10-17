// lib/cloudinary.js
export async function uploadImageToCloudinary(file) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloud || !preset) {
    throw new Error("Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  // ถ้าต้องการโฟลเดอร์เฉพาะ: เปิดคอมเมนต์บรรทัดล่าง
  // fd.append("folder", "fitnu/chat");

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${t}`);
  }
  const data = await res.json();

  // กันพลาดบาง preset ที่คืนเฉพาะ url
  return {
    secure_url: data.secure_url || data.url,
    url: data.url || data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}
