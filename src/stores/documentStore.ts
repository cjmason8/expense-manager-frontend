import axios from "axios";

export const useDocumentStore = defineStore("document", () => {
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadFile", file);

    try {
      const response = await axios.post(
        "/api/documents/upload?type=donations",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const getFileById = async (id: number, fileName: string) => {
    let mediaType = getMediaType(fileName);

    const response = await axios.get(`/api/documents/get/${id}`, {
      responseType: "arraybuffer",
      headers: { "Content-Type": mediaType, Accept: mediaType },
    });

    return new Blob([response.data], { type: mediaType });
  };

  function getMediaType(fileName: string) {
    let mediaType = "application/pdf";
    if (fileName.endsWith("doc") || fileName.endsWith("docx")) {
      mediaType = "application/msword";
    } else if (fileName.endsWith("xls") || fileName.endsWith("xlsx")) {
      mediaType = "application/vnd.ms-excel";
    } else if (fileName.endsWith("jpg") || fileName.endsWith("jpeg")) {
      mediaType = "image/jpeg";
    }

    return mediaType;
  }

  return { uploadFile, getFileById };
});
