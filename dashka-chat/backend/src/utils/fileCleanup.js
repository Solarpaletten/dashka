const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function cleanupTempFiles(directories = ['temp', 'tmp']) {
  directories.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          try {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            // Удаляем файлы старше 1 часа
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            if (stats.mtimeMs < oneHourAgo) {
              fs.unlinkSync(filePath);
              logger.debug(`Cleanup: removed ${filePath}`);
            }
          } catch (err) {
            logger.warn(`Failed to cleanup file ${file}: ${err.message}`);
          }
        });
      }
    } catch (err) {
      logger.warn(`Failed to cleanup directory ${dir}: ${err.message}`);
    }
  });
}

// Запускаем очистку каждые 30 минут
setInterval(cleanupTempFiles, 30 * 60 * 1000);

module.exports = { cleanupTempFiles };