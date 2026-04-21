const { Storage } = require('@google-cloud/storage');
const path = require('path');
require('dotenv').config();

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Uploads a file to GCS with organized folder structure
 * @param {Buffer} fileBuffer 
 * @param {string} originalName 
 * @param {string} module - 'backlogs', 'app-groups', 'apps', etc.
 * @param {string} type - 'image', 'video', 'audio', 'document', 'others'
 */
const uploadFile = async (fileBuffer, originalName, module, type) => {
  const fileName = `${Date.now()}-${originalName}`;
  const gcsPath = `${module}/${type}/${fileName}`;
  const file = bucket.file(gcsPath);

  await file.save(fileBuffer, {
    resumable: false,
    contentType: 'auto'
  });

  try {
    await file.makePublic();
  } catch (err) {
    console.warn('Could not make file public, check bucket permissions:', err.message);
  }

  // For public access, we might need file.makePublic() if bucket is not public
  // Or use signed URLs. Given it's a catalog, we might want public read.
  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`;
  
  return {
    url: publicUrl,
    fileName: fileName,
    path: gcsPath
  };
};

module.exports = {
  uploadFile
};
