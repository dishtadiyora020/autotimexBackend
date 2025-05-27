const searchQuery = (search, fields = []) => {
    if (!search || fields.length === 0) return {};

    const searchTerm = search.toString().trim();

    return {
        $or: fields.map(field => {
            if (typeof field === 'object') {
                const { name, type } = field;

                switch (type) {
                    case 'number':
                        const numValue = Number(searchTerm);
                        return !isNaN(numValue) ? { [name]: numValue } : {};

                    case 'string':
                        return {
                            [name]: {
                                $regex: searchTerm,
                                $options: 'i'
                            }
                        };

                    case 'objectId':
                        return { [name]: searchTerm };

                    default:
                        return {
                            [name]: {
                                $regex: searchTerm,
                                $options: 'i'
                            }
                        };
                }
            }
            return {
                [field]: {
                    $regex: searchTerm,
                    $options: 'i'
                }
            };
        }).filter(query => Object.keys(query).length > 0)
    };
};

const filterQuery = (filters = {}) => {
    const processedFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
            if (value.$gte || value.$lte) {
                processedFilters[key] = value;
            }
        } else {
            processedFilters[key] = value;
        }
    });

    return processedFilters;
};

const sortingQuery = (sortBy = null, sortOrder = null) => {

    if (sortBy === null || sortOrder === null) return { $sort: { created_at: -1 } };

    if (![1, -1].includes(Number(sortOrder))) return { $sort: { created_at: -1 } };

    return {
        $sort: {
            [sortBy]: Number(sortOrder)
        }
    };
};

const getPagination = (page, limit) => {
    if (!page || !limit) return [];
    page = Number(page);
    limit = Number(limit);
    if (typeof page !== 'number' || typeof limit !== 'number' || Number.isNaN(page) || Number.isNaN(limit)) return [];
    return [
        {
            $skip: (Number(page) - 1) * Number(limit),
        },
        {
            $limit: Number(limit)
        }
    ]
};

const generateKey = (value) => {
    const key = String(value).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '_');
    return key
};

const generateApiKey = (length = 32) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
const generateDomainSlug = (value = '') => {
    const slug = String(value).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-');
    return slug
};

async function carApiAuth() {
    const apiUrl = 'https://carapi.app/api/auth/login';
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'text/plain',
            },
            body: JSON.stringify({
                api_token: process.env.CAR_API_TOKEN,
                api_secret: process.env.CAR_API_SECRET,
            }),
        });
        const rawResponse = await response.text(); // Get raw response as text
        if (!response.ok) {
            throw new Error(`Login failed with status: ${response.status} - ${rawResponse}`);
        }
        try {
            const data = rawResponse; // Attempt to parse as JSON
            return data;
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error(`Failed to parse JSON: ${parseError.message} - Raw Response: ${rawResponse}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error; // Re-throw the error so the calling function can handle it.
    }
}


export {
    searchQuery,
    filterQuery,
    sortingQuery,
    getPagination,
    generateKey,
    carApiAuth,
    generateDomainSlug,
    generateApiKey
};