import { Router } from 'express';
import { createUpload, finalizeUpload, removeMedia } from '../controllers/mediaController.js';

export const mediaRoutes = Router();

// Create upload (get upload URL/path)
mediaRoutes.post('/create-upload', createUpload);

// Finalize upload (verify and link to capsule)
mediaRoutes.post('/finalize-upload', finalizeUpload);

// Remove media (delete from storage and capsule)
mediaRoutes.post('/remove', removeMedia);
