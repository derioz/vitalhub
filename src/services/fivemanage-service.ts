export const FiveManageService = {
    /**
     * Upload an image to FiveManage
     * Requires NEXT_PUBLIC_FIVEMANAGE_API_TOKEN in .env.local
     */
    uploadImage: async (file: File): Promise<string> => {
        const token = process.env.NEXT_PUBLIC_FIVEMANAGE_API_TOKEN;

        if (!token) {
            throw new Error('FiveManage API Token not configured');
        }

        const formData = new FormData();
        formData.append('image', file);

        // Standard FiveManage upload endpoint
        const response = await fetch('https://api.fivemanage.com/v1/media/upload', {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
        }

        const data = await response.json();
        return data.url;
    }
};
