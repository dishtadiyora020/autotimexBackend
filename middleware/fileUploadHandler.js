import multer from 'multer'
import fs from 'fs'
import path from 'path'

const storage = multer.memoryStorage()

const upload = multer({ storage: storage })

const writeBufferToFile = async (buffer, dirname, originalFilename) => {
    const directory = path.join('public', "uploads", dirname);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    const finalPath = path.join(directory, originalFilename)

    return new Promise((resolve, reject) => {
        fs.writeFile(finalPath, buffer, (err) => {
            if (err) {
                reject(err);
            } else {
                const baseUrl = process.env.SERVER_URL
                const fileUrl = `${baseUrl}/${finalPath.replace(/\\/g, '/')}`;
                resolve(fileUrl);
            }
        });
    });
};


export { upload, writeBufferToFile }