const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const OpenAI = require('openai');

/**
 * Text-to-Speech Service using OpenAI TTS API
 * Supports multiple languages and voices
 */
class TextToSpeechService {
  constructor() {
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.enabled = true;
      console.log('🔊 Text-to-Speech Service initialized (OpenAI TTS)');
    } else {
      this.openai = null;
      this.enabled = false;
      console.log('🔊 Text-to-Speech Service initialized (mock mode - no API key)');
    }

    // Supported languages with their voice preferences
    this.supportedLanguages = {
      'en': { name: 'English', voice: 'alloy' },
      'ru': { name: 'Russian', voice: 'shimmer' },
      'de': { name: 'German', voice: 'onyx' },
      'es': { name: 'Spanish', voice: 'nova' },
      'cs': { name: 'Czech', voice: 'fable' },
      'pl': { name: 'Polish', voice: 'echo' },
      'lt': { name: 'Lithuanian', voice: 'alloy' },
      'lv': { name: 'Latvian', voice: 'alloy' },
      'no': { name: 'Norwegian', voice: 'onyx' },
      'fr': { name: 'French', voice: 'nova' }
    };

    // Available OpenAI voices
    this.availableVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

    // TTS models
    this.models = {
      standard: 'tts-1',      // Faster, lower quality
      hd: 'tts-1-hd'          // Slower, higher quality
    };

    // Ensure temp directory exists
    this.ensureTempDir();
  }

  /**
   * Ensure temporary directory for audio files exists
   */
  async ensureTempDir() {
    const tempDir = path.join(__dirname, '../../tmp');
    try {
      if (!fsSync.existsSync(tempDir)) {
        await fs.mkdir(tempDir, { recursive: true });
        console.log('📁 Created tmp directory for TTS');
      }
    } catch (error) {
      console.error('Failed to create tmp directory:', error);
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (e.g., 'en', 'ru', 'de')
   * @param {string} voice - Voice name (optional, auto-selected based on language)
   * @param {string} model - TTS model ('standard' or 'hd')
   * @param {number} speed - Speech speed (0.25 to 4.0)
   * @returns {Object} Result with audioPath, language, text, duration, provider
   */
  async generateSpeech(text, language = 'en', voice = null, model = 'standard', speed = 1.0) {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text is required for TTS');
      }

      if (text.length > 4096) {
        throw new Error('Text too long (max 4096 characters)');
      }

      // Normalize language code
      const langCode = language.toLowerCase();
      
      // Select voice based on language if not specified
      const selectedVoice = voice || this.supportedLanguages[langCode]?.voice || 'alloy';

      // Validate voice
      if (!this.availableVoices.includes(selectedVoice)) {
        throw new Error(`Invalid voice. Available: ${this.availableVoices.join(', ')}`);
      }

      // Validate speed
      if (speed < 0.25 || speed > 4.0) {
        throw new Error('Speed must be between 0.25 and 4.0');
      }

      // If OpenAI not configured, return mock
      if (!this.enabled) {
        return this.generateMockSpeech(text, langCode);
      }

      // Generate filename
      const filename = `tts_${Date.now()}_${langCode}.mp3`;
      const tempDir = path.join(__dirname, '../../tmp');
      const filepath = path.join(tempDir, filename);

      console.log(`🔊 Generating speech: "${text.substring(0, 50)}..." (${langCode}, ${selectedVoice})`);

      // Call OpenAI TTS API
      const mp3Response = await this.openai.audio.speech.create({
        model: this.models[model] || this.models.standard,
        voice: selectedVoice,
        input: text,
        speed: speed,
        response_format: 'mp3'
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());

      // Write to file
      await fs.writeFile(filepath, buffer);

      // Estimate duration (approximate: 150 words per minute average)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // seconds

      const result = {
        audioPath: filepath,
        audioUrl: `/audio/${filename}`,
        language: langCode,
        text: text,
        voice: selectedVoice,
        model: this.models[model],
        duration: estimatedDuration,
        fileSize: buffer.length,
        processingTime: Date.now() - startTime,
        provider: 'openai-tts'
      };

      console.log(`✅ TTS generated: ${filename} (${buffer.length} bytes, ${estimatedDuration}s)`);

      return result;

    } catch (error) {
      console.error('TTS Error:', error.message);

      // Fallback to mock on error
      if (this.enabled) {
        console.log('🔄 Falling back to mock TTS due to error');
        return this.generateMockSpeech(text, language, error.message);
      }

      throw new Error(`Text-to-Speech failed: ${error.message}`);
    }
  }

  /**
   * Generate mock speech (fallback when API unavailable)
   * @param {string} text - Text content
   * @param {string} language - Language code
   * @param {string} errorMessage - Optional error message
   * @returns {Object} Mock result
   */
  async generateMockSpeech(text, language, errorMessage = null) {
    try {
      const tempDir = path.join(__dirname, '../../tmp');
      const filename = `tts_mock_${Date.now()}_${language}.mp3`;
      const filepath = path.join(tempDir, filename);

      // Create a small valid MP3 file (silent audio)
      // This is a minimal valid MP3 header + frame
      const mockMp3Data = Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);

      await fs.writeFile(filepath, mockMp3Data);

      console.log(`⚠️ Generated mock TTS: ${filename}`);

      return {
        audioPath: filepath,
        audioUrl: `/audio/${filename}`,
        language,
        text,
        voice: 'mock',
        duration: Math.ceil(text.length * 0.05), // Rough estimate
        fileSize: mockMp3Data.length,
        processingTime: 10,
        provider: 'mock-tts',
        ...(errorMessage && { error: errorMessage })
      };
    } catch (error) {
      console.error('Mock TTS error:', error);
      throw new Error(`Mock TTS failed: ${error.message}`);
    }
  }

  /**
   * Generate speech with retry logic
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Object} Result
   */
  async generateSpeechWithRetry(text, language = 'en', maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateSpeech(text, language);
      } catch (error) {
        lastError = error;
        console.warn(`TTS attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`TTS failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Generate speech for multiple texts in batch
   * @param {Array} texts - Array of {text, language} objects
   * @returns {Array} Array of results
   */
  async generateBatch(texts) {
    const results = [];

    for (const item of texts) {
      try {
        const result = await this.generateSpeech(item.text, item.language);
        results.push({ ...result, success: true });
      } catch (error) {
        results.push({
          text: item.text,
          language: item.language,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Clean up old audio files
   * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
   */
  async cleanupOldFiles(maxAgeMs = 60 * 60 * 1000) {
    try {
      const tempDir = path.join(__dirname, '../../tmp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('tts_')) {
          const filepath = path.join(tempDir, file);
          const stats = await fs.stat(filepath);

          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.unlink(filepath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old TTS files`);
      }
    } catch (error) {
      console.warn('TTS cleanup error:', error.message);
    }
  }

  /**
   * Get supported languages
   * @returns {Object} Supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Get available voices
   * @returns {Array} Available voice names
   */
  getAvailableVoices() {
    return this.availableVoices;
  }

  /**
   * Check if TTS is enabled
   * @returns {boolean} True if OpenAI TTS is configured
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get service statistics
   * @returns {Object} Service stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      supportedLanguages: Object.keys(this.supportedLanguages).length,
      availableVoices: this.availableVoices.length,
      models: Object.keys(this.models),
      provider: this.enabled ? 'openai-tts' : 'mock'
    };
  }

  // ============================================
  // Legacy compatibility methods
  // ============================================

  /**
   * Legacy method for backward compatibility
   * @param {string} text - Text to speak
   * @param {string} language - Language code
   * @returns {string} Audio file path
   */
  async speakText(text, language = 'en') {
    const result = await this.generateSpeech(text, language);
    return result.audioPath;
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

// Schedule cleanup every 30 minutes
setInterval(() => {
  ttsService.cleanupOldFiles();
}, 30 * 60 * 1000);

// ============================================
// Export functions for compatibility
// ============================================

/**
 * Generate speech (compatibility export)
 */
async function speakText(text, language = 'en') {
  return await ttsService.speakText(text, language);
}

/**
 * Generate speech with full options
 */
async function generateSpeech(text, language = 'en', voice = null, model = 'standard', speed = 1.0) {
  return await ttsService.generateSpeech(text, language, voice, model, speed);
}

module.exports = {
  speakText,
  generateSpeech,
  TextToSpeechService,
  ttsService
};