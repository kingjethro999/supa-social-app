import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';

export const getUserImageSrc = imagePath => {
    if (!imagePath) {
        return require('../assets/images/defaultUser.png');
    }
    
    // Handle both full URLs and relative paths
    if (imagePath.startsWith('http')) {
        return { uri: imagePath };
    }
    
    // Construct full Supabase URL
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${imagePath}`;
    return { uri: fullUrl };
};

export const getSupabaseFileUrl = (filePath) => {
    if (!filePath) {
        return null;
    }

    // If it's already a full URL, return it as is
    if (filePath.startsWith('http')) {
        return { uri: filePath };
    }

    // Construct the full Supabase storage URL
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`;
    return { uri: fullUrl };
};

export const downloadFile = async (url)=>{
    try {
        const {uri} = await FileSystem.downloadAsync(url, getLocalFilePath(url))
        return uri;
    } catch (error) {
        return null;
    }
}

export const getLocalFilePath = filePath => {
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
}

export const uploadFile = async (folderName, fileUri, isImage = true) => {
    try {
        const fileName = getFilePath(folderName, isImage);
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        const imageData = decode(fileBase64);
        
        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, imageData, {
                cacheControl: '3600',
                upsert: true,
                contentType: isImage ? 'image/png' : 'video/*'
            });

        if (error) {
            console.log('File upload error:', error);
            return { success: false, msg: 'Could not upload media' };
        }

        return { success: true, data: data.path };
    } catch (error) {
        console.log('File upload error:', error);
        return { success: false, msg: 'Could not upload media' };
    }
};

export const getFilePath = (folderName, isImage) => {
    return `${folderName}/${new Date().getTime()}${isImage ? '.png' : '.mp4'}`;
};