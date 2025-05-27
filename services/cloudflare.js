import axios from "axios";

export const cloudFlareService = async (url, method, data) => {
    try {
        const config = {
            headers: {
                "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            },
            baseURL: process.env.CLOUDFLARE_API_URI,
            url,
            method,
            data
        }
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.log(error);
        return error;
    }
}