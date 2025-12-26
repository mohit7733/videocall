import OpenAI from 'openai';
import fs from 'fs';
import { uploadFile } from './aws.service.js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Convert audio file to text using Whisper API
 * @param {Buffer|string} audioFile - Audio file buffer or file path
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudio = async (audioFile, fileName = 'audio.mp3') => {
  try {
    let fileBuffer;
    let tempFilePath = null;

    // Handle both Buffer and file path
    if (Buffer.isBuffer(audioFile)) {
      fileBuffer = audioFile;
      // Create temporary file for OpenAI API
      tempFilePath = `./temp_${uuidv4()}_${fileName}`;
      fs.writeFileSync(tempFilePath, fileBuffer);
    } else {
      tempFilePath = audioFile;
    }

    // Upload to OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });

    // Clean up temporary file if we created it
    if (tempFilePath && Buffer.isBuffer(audioFile)) {
      fs.unlinkSync(tempFilePath);
    }

    // Handle response format - text format returns string directly
    return typeof transcription === 'string' ? transcription : transcription.text || String(transcription);
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

/**
 * Transcribe audio from S3 URL
 * @param {string} audioUrl - S3 URL of the audio file
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudioFromUrl = async (audioUrl) => {
  try {
    // Download file from URL
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await transcribeAudio(buffer, 'audio.mp3');
  } catch (error) {
    console.error('Whisper transcription from URL error:', error);
    throw new Error(`Failed to transcribe audio from URL: ${error.message}`);
  }
};

