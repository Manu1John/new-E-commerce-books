import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: (
        req,
        file,
        cb
    ) => {

        cb(
            null,
            "public/uploads"
        );
    },

    filename: (
        req,
        file,
        cb
    ) => {

        cb(
            null,
            Date.now() +
            path.extname(
                file.originalname
            )
        );
    }
});

const fileFilter = (
    req,
    file,
    cb
) => {

    const allowedTypes =
        /jpg|jpeg|png|webp/;

    const extname =
        allowedTypes.test(
            path.extname(
                file.originalname
            ).toLowerCase()
        );

    const mimetype =
        allowedTypes.test(
            file.mimetype
        );

    if (
        extname &&
        mimetype
    ) {
        return cb(
            null,
            true
        );
    }

    cb(
        new Error(
            "Only images allowed"
        )
    );
};

const upload = multer({
    storage,
    fileFilter
});

export default upload;