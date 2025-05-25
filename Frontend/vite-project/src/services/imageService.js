
const IMAGES_DB = {
    images: [],
    nextId: 1
};

export const uploadImage = async (file, patientId, metadata = {}) => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {

            const newImage = {
                id: `IMG-${Date.now()}`,
                patientId,
                url: reader.result,
                contentType: file.type,
                uploadedAt: new Date().toISOString(),
                metadata: {
                    originalName: file.name,
                    size: file.size,
                    ...metadata
                }
            };


            IMAGES_DB.images.push(newImage);
            IMAGES_DB.nextId++;

            console.log("Image uploaded:", newImage.id);
            resolve(newImage);
        };

        reader.readAsDataURL(file);
    });
};


export const getPatientImages = (patientId) => {
    return IMAGES_DB.images.filter(img => img.patientId === patientId);
};


export const getImage = (imageId) => {
    return IMAGES_DB.images.find(img => img.id === imageId);
};


export const deleteImage = (imageId) => {
    const index = IMAGES_DB.images.findIndex(img => img.id === imageId);
    if (index !== -1) {
        IMAGES_DB.images.splice(index, 1);
        return true;
    }
    return false;
};


export const linkImagesToReport = (reportId, imageIds) => {

    imageIds.forEach(imageId => {
        const image = IMAGES_DB.images.find(img => img.id === imageId);
        if (image) {
            image.reportId = reportId;
        }
    });

    return imageIds.map(id => IMAGES_DB.images.find(img => img.id === id)).filter(Boolean);
  };