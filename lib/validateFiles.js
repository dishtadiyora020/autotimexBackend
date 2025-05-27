const validateFiles = (files, { allowedExtensions = [], maxSizeInMB = 5 }) => {

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    const fileArray = Array.from(files);

    const results = {
        isValid: true,
        errors: [],
        validFiles: [],
        invalidFiles: []
    };

    fileArray.forEach(file => {
        const fileErrors = [];

        const extension = file.originalname .split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            fileErrors.push({
                type: 'extension',
                message: `Invalid file extension: ${extension}. Allowed extensions are: ${allowedExtensions.join(', ')}`
            });
        }

        if (file.size > maxSizeInBytes) {
            fileErrors.push({
                type: 'size',
                message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeInMB}MB`
            });
        }

        if (fileErrors.length > 0) {
            results.isValid = false;
            results.invalidFiles.push({
                file,
                errors: fileErrors
            });
            results.errors.push({
                fileName: file.name,
                errors: fileErrors
            });
        } else {
            results.validFiles.push(file);
        }
    });

    return results;
};

export default validateFiles;