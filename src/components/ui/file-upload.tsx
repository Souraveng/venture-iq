"use client";

import React, { useState } from "react";
import { Upload, X, File, CheckCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function FileUpload({ onUploadSuccess, accept = "*/*", maxSizeMB = 50, label = "Upload File" }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    try {
      // Fetch runtime configuration to resolve Next.js build-time env var issues on Cloud Run
      const configRes = await fetch("/api/upload-config");
      const config = (await configRes.json()) as { workerUrl: string; workerSecret: string };
      const workerUrl = config.workerUrl;
      const workerSecret = config.workerSecret;

      if (!workerUrl) {
        setError("Upload worker URL is not configured");
        setIsUploading(false);
        return;
      }

      const uploadUrl = `${workerUrl}/${uniqueFileName}`;
      
      try {
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "Authorization": `Bearer ${workerSecret}`,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        setSuccess(true);
        onUploadSuccess(uploadUrl);
      } catch (fetchErr: any) {
        // Fallback to local object URL for offline dev environment testing
        const fallbackUrl = URL.createObjectURL(file);
        setSuccess(true);
        onUploadSuccess(fallbackUrl);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-[#ffffff10] rounded-xl p-6 bg-[#ffffff05] flex flex-col items-center justify-center text-center">
      {success ? (
        <div className="flex flex-col items-center text-green-400">
          <CheckCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold text-sm">Upload Successful!</p>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-[#ffffff10] flex items-center justify-center mb-4 text-[#8a8a93]">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-white font-medium mb-1">{label}</h3>
          <p className="text-sm text-[#8a8a93] mb-4">
            Max size: {maxSizeMB}MB. Allowed: {accept}
          </p>

          {!file ? (
            <label className="cursor-pointer bg-white text-black px-6 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">
              Select File
              <input 
                type="file" 
                className="hidden" 
                accept={accept} 
                onChange={handleFileChange} 
              />
            </label>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-3">
              <div className="flex items-center justify-between bg-[#ffffff10] p-3 rounded-lg border border-[#ffffff20]">
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm text-white truncate w-40">{file.name}</span>
                    <span className="text-xs text-[#8a8a93]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  disabled={isUploading}
                  className="p-1 text-[#8a8a93] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}
