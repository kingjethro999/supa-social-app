import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Share } from 'react-native';

/**
 * A utility for handling file and text sharing across the app
 */
const shareContent = async ({ 
  fileUrl,      // Remote URL of the file to share
  message = '', // Optional message to share 
  fileName = '' // Optional custom filename
}) => {
  try {
    // Handle text-only sharing directly using Share API
    if (!fileUrl && message) {
      return await Share.share({
        message: message,
      });
    }

    // Handle file sharing with optional message
    if (fileUrl) {
      // Generate a local file name if none provided
      const localFileName = fileName || fileUrl.split('/').pop();
      const localFilePath = `${FileSystem.cacheDirectory}${localFileName}`;

      // Download the file to local cache
      await FileSystem.downloadAsync(fileUrl, localFilePath);

      // Check if file exists locally
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (!fileInfo.exists) {
        throw new Error('File download failed');
      }

      // Share the local file with message
      await Sharing.shareAsync(localFilePath, {
        mimeType: getMimeType(localFileName),
        dialogTitle: 'Share Post',
        UTI: getUTI(localFileName), // For iOS
        message: message // Add message to share dialog
      });

      // Clean up - remove the cached file
      await FileSystem.deleteAsync(localFilePath, { idempotent: true });
    }

    return { success: true };
  } catch (error) {
    console.error('Sharing error:', error);
    Alert.alert('Sharing Failed', 'Unable to share the content at this time');
    return { success: false, error };
  }
};

// Helper to determine mime type from file extension
const getMimeType = (fileName) => {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    // Add more as needed
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Helper for iOS UTI (Uniform Type Identifier)
const getUTI = (fileName) => {
  const ext = fileName.toLowerCase().split('.').pop();
  const utis = {
    'png': 'public.png',
    'jpg': 'public.jpeg',
    'jpeg': 'public.jpeg',
    'gif': 'com.compuserve.gif',
    'mp4': 'public.mpeg-4',
    'mov': 'com.apple.quicktime-movie',
    'pdf': 'com.adobe.pdf',
    'txt': 'public.plain-text',
    // Add more as needed
  };
  return utis[ext] || 'public.data';
};

export default shareContent;