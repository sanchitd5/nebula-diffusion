import CONFIG from '../config';
import { generateFilenameWithExtension } from '../utils';
import { parallel, waterfall } from 'async';
import { resolve } from 'path';
import { unlink, createWriteStream, copy, readFile} from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import * as AWS from 'aws-sdk';
import * as gmParent from 'gm';
import { GenericServiceCallback } from '../definations';
import converters from '../utils/converters';

const deleteFile = (path: string, callback: (err: NodeJS.ErrnoException | null | undefined) => void) => {
    unlink(path, function (err) {
        uploadLogger.error("delete", err);
        if (err) {
            const error: any = {
                response: {
                    message: "Something went wrong",
                    data: {}
                },
                statusCode: 500
            };
            return callback(error);
        } else
            return callback(null);
    });

}
const uploadImageToS3Bucket = function uploadImageToS3Bucket(file: any, isThumb: boolean, callback: GenericServiceCallback) {

    let path = file.path, filename = file.name, folder = file.s3Folder;
    const mimeType = file.mimeType;
    if (isThumb) {
        path = path + 'thumb/';
        filename = file.thumbName;
        folder = file.s3FolderThumb;
    }
    //<------ Start of Configuration for ibm bucket -------------->
    const ibms3Config = {
        endpoint: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint,
        apiKeyId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.apiKeyId,
        serviceInstanceId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.serviceInstanceId
    };
    //<------ End of Configuration for ibm bucket -------------->
    uploadLogger.info("path to read::" + path + filename);
    readFile(path + filename, function (error, fileBuffer) {
        uploadLogger.info("path to read from temp::" + path + filename);
        if (error) {
            uploadLogger.error("UPLOAD", error, fileBuffer);
            const errResp = {
                response: {
                    message: "Something went wrong",
                    data: {}
                },
                statusCode: 500
            };
            return callback(errResp);
        }

        const s3bucket = new AWS.S3(ibms3Config);
        const params = {
            Bucket: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.bucket,
            Key: folder + '/' + filename,
            Body: fileBuffer,
            ACL: 'public-read',
            ContentType: mimeType
        };

        s3bucket.putObject(params, function (err) {
            if (err) {
                const error = {
                    response: {
                        message: "Something went wrong",
                        data: {}
                    },
                    statusCode: 500
                };
                return callback(error);
            }
            else {
                deleteFile(path + filename, function (err) {
                    uploadLogger.error(err);
                    if (err)
                        return callback(err);
                    else
                        return callback(null);
                })
            }
        });
    });
};

function initParallelUpload(fileObj: any, withThumb: boolean, callbackParent: GenericServiceCallback) {
    parallel([
        (callback) => {
            uploadLogger.info("uploading image");
            uploadImageToS3Bucket(fileObj, false, callback as any);
        },
        (callback) => {
            if (withThumb) {
                uploadLogger.info("uploading thumbnil");
                uploadImageToS3Bucket(fileObj, true, callback as any);
            }
            else
                callback(null);
        }
    ], function (error) {
        if (error)
            callbackParent(error);
        else
            callbackParent(null);
    })

}
const saveFile = function saveFile(fileData: any, path: string, callback: GenericServiceCallback) {

    const file = createWriteStream(path);
    uploadLogger.info("=========save file======");
    file.on('error', function (err) {

        uploadLogger.error('@@@@@@@@@@@@@', err);
        const error = {
            response: {
                message: "Some",
                data: {}
            },
            statusCode: 500
        };
        return callback(error);
    });

    fileData.pipe(file);

    fileData.on('end', function (err: Error) {
        if (err) {
            const error = {
                response: {
                    message: "Some",
                    data: {}
                },
                statusCode: 500
            };
            return callback(error);
        } else
            callback(null);
    });


};
const createThumbnailImage = function createThumbnailImage(path: string, name: string, callback: GenericServiceCallback) {
    uploadLogger.info('------first-----');
    const gm = gmParent.subClass({ imageMagick: true });
    const thumbPath = path + 'thumb/' + "Thumb_" + name;
    //var tmp_path = path + "-tmpPath"; //will be put into a temp directory

    gm(path + name)
        .resize(160, 160, "!")
        .autoOrient()
        .write(thumbPath, function (err: Error) {
            uploadLogger.info('createThumbnailImage');
            if (!err) {
                return callback(null);
            } else {
                const error = {
                    response: {
                        message: "Something went wrong",
                        data: {}
                    },
                    statusCode: 500
                };
                uploadLogger.info('<<<<<<<<<<<<<<<<<', error);
                return callback(error);
            }
        })
};

const getVideoInfo = function (filePath: string, callback: GenericServiceCallback) {
    ffmpeg.ffprobe(filePath, function (err, data) {
        if (err) callback(err)
        else callback(null, data)
    })
}

const createThumbnailVideo = function (filePath: string, name: string, videoData: any, callback: GenericServiceCallback) {
    uploadLogger.info('------first-----');
    const thumbPath = filePath + 'thumb/' + 'Thumb_' + name.split('.').slice(0, -1).join('.') + '.jpg';
    const durationInSeconds = videoData.format.duration;
    const frameIntervalInSeconds = Math.floor(durationInSeconds);
    ffmpeg().input(filePath + name).outputOptions([`-vf fps=1/${frameIntervalInSeconds}`]).output(thumbPath).on('end', function () {
        callback(null)
    }).on('error', function (err) {
        callback(err)
    }).run()
};

function uploadFile(otherConstants: any, fileDetails: any, createThumbnail: boolean, callbackParent: GenericServiceCallback) {
    const filename = fileDetails.name;
    const TEMP_FOLDER = otherConstants.TEMP_FOLDER;
    const s3Folder = otherConstants.s3Folder;
    const file = fileDetails.file;
    const mimiType = file.hapi.headers['content-type'];
    waterfall([
        function (callback: GenericServiceCallback) {
            uploadLogger.info('TEMP_FOLDER + filename' + TEMP_FOLDER + filename)
            saveFile(file, TEMP_FOLDER + filename, callback);
            uploadLogger.info("*******save File******")
        },
        function (callback: GenericServiceCallback) {
            if (createThumbnail) {
                createThumbnailImage(TEMP_FOLDER, filename, callback);
                uploadLogger.info("*******thumbnailImage********")
            }

            else
                callback(null);
        },
        function (callback: GenericServiceCallback) {
            const fileObj = {
                path: TEMP_FOLDER,
                name: filename,
                thumbName: "Thumb_" + filename,
                mimeType: mimiType,
                s3Folder: s3Folder,
                s3FolderThumb: undefined
            };
            if (createThumbnail)
                fileObj.s3FolderThumb = otherConstants.s3FolderThumb;
            initParallelUpload(fileObj, createThumbnail, callback);
        }
    ], function (error) {
        if (error)
            callbackParent(error);
        else
            callbackParent(null);
    })
}


function uploadVideoFile(otherConstants: any, fileDetails: any, createThumbnail: boolean, callbackParent: GenericServiceCallback) {
    const filename = fileDetails.name;
    const TEMP_FOLDER = otherConstants.TEMP_FOLDER;
    const s3Folder = otherConstants.s3Folder;
    const file = fileDetails.file;
    const mimiType = file.hapi.headers['content-type'];
    let videoData: any;
    waterfall([
        function (callback: GenericServiceCallback) {
            uploadLogger.info('TEMP_FOLDER + filename' + TEMP_FOLDER + filename)
            saveFile(file, TEMP_FOLDER + filename, callback);
            uploadLogger.info("*******save File******", callback)
        },
        function (callback: GenericServiceCallback) {
            getVideoInfo(TEMP_FOLDER + filename, (err, data) => {
                if (err) callback(err)
                else {
                    videoData = data;
                    callback(null)
                }
            })
        },
        function (callback: GenericServiceCallback) {
            if (createThumbnail) {
                createThumbnailVideo(TEMP_FOLDER, filename, videoData, callback);
            }

            else
                callback(null);
        },
        function (callback: GenericServiceCallback) {
            const fileObj = {
                path: TEMP_FOLDER,
                name: filename,
                thumbName: "Thumb_" + filename.split('.').slice(0, -1).join('.') + '.jpg',
                mimeType: mimiType,
                s3Folder: s3Folder,
                s3FolderThumb: undefined
            };
            if (createThumbnail)
                fileObj.s3FolderThumb = otherConstants.s3FolderThumb;
            initParallelUpload(fileObj, createThumbnail, callback);
        }
    ], function (error) {
        if (error)
            callbackParent(error);
        else
            callbackParent(null, { videoData: videoData });
    })
}


function uploadProfilePicture(profilePicture: any, folder: string, filename: string, callbackParent: GenericServiceCallback) {
    const baseFolder = folder + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.profilePicture;
    const baseURL = "https://" + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.bucket + '/' + baseFolder + '/';
    const urls: any = {};
    waterfall([
        function (callback: GenericServiceCallback) {
            const profileFolder = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.original;
            const profileFolderThumb = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.thumb;
            const profilePictureName = generateFilenameWithExtension(profilePicture.hapi.filename, "Profile_" + filename);
            const s3Folder = baseFolder + '/' + profileFolder;
            const s3FolderThumb = baseFolder + '/' + profileFolderThumb;
            const profileFolderUploadPath = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.projectFolder + "/profilePicture";
            const path = resolve("..") + "/uploads/" + profileFolderUploadPath + "/";
            const fileDetails = {
                file: profilePicture,
                name: profilePictureName
            };
            const otherConstants = {
                TEMP_FOLDER: path,
                s3Folder: s3Folder,
                s3FolderThumb: s3FolderThumb
            };
            urls.profilePicture = baseURL + profileFolder + '/' + profilePictureName;
            urls.profilePictureThumb = baseURL + profileFolderThumb + '/Thumb_' + profilePictureName;
            uploadFile(otherConstants, fileDetails, true, callback);
        }
    ],

        function (error) {
            if (error) {
                uploadLogger.error("upload image error :: ", error);
                callbackParent(error);
            }
            else {
                uploadLogger.info("upload image result :", urls);
                callbackParent(null, urls);
            }
        })
}

const uploadfileWithoutThumbnail = (docFile: any, folder: string, filename: string, callbackParent: GenericServiceCallback) => {
    const baseFolder = folder + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.docs;
    const baseURL = "https://" + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.bucket + '/' + baseFolder + '/';
    const urls: any = {};
    waterfall([
        (callback) => {
            const docFileFolder = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.original;
            //var profileFolderThumb =CONFIG.awsS3Config.s3BucketCredentials.folder.thumb;
            const docFileName = generateFilenameWithExtension(docFile.hapi.filename, "Docs_" + filename);
            const s3Folder = baseFolder + '/' + docFileFolder;
            //var s3FolderThumb = baseFolder + '/' + profileFolderThumb;
            const docFolderUploadPath = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.projectFolder + "/docs";
            const path = resolve("..") + "/uploads/" + docFolderUploadPath + "/";
            const fileDetails = {
                file: docFile,
                name: docFileName
            };
            const otherConstants = {
                TEMP_FOLDER: path,
                s3Folder: s3Folder
                //s3FolderThumb: s3FolderThumb
            };
            urls.docFile = baseURL + docFileFolder + '/' + docFileName;
            //urls.profilePictureThumb = baseURL + profileFolderThumb + '/Thumb_' + profilePictureName;
            uploadFile(otherConstants, fileDetails, false, callback);
        }
    ],

        function (error) {
            if (error) {
                uploadLogger.error("upload image error :: ", error);
                callbackParent(error);
            }
            else {
                uploadLogger.info("upload image result :", urls);
                callbackParent(null, urls);
            }
        })
}

function uploadVideoWithThumbnail(videoFile: any, folder: string, filename: string, callbackParent: GenericServiceCallback) {
    const baseFolder = folder + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.video;
    const baseURL = "https://" + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint + '/' + CONFIG.AWS_S3_CONFIG.s3BucketCredentials.bucket + '/' + baseFolder + '/';
    const urls: any = {};
    let fileDetails, otherConstants;
    waterfall([
        (callback) => {
            const videoFileFolder = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.original;
            const videoFolderThumb = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.folder.thumb;
            const videoFileName = generateFilenameWithExtension(videoFile.hapi.filename, "Video_" + filename);
            const s3Folder = baseFolder + '/' + videoFileFolder;
            const s3FolderThumb = baseFolder + '/' + videoFolderThumb;
            const videoFolderUploadPath = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.projectFolder + "/video";
            const path = resolve("..") + "/uploads/" + videoFolderUploadPath + "/";
            fileDetails = {
                file: videoFile,
                name: videoFileName
            };
            otherConstants = {
                TEMP_FOLDER: path,
                s3Folder: s3Folder,
                s3FolderThumb: s3FolderThumb
            };
            urls.videoFile = baseURL + videoFileFolder + '/' + videoFileName;
            urls.videoFileThumb = baseURL + videoFolderThumb + '/Thumb_' + videoFileName.split('.').slice(0, -1).join('.') + '.jpg';
            uploadVideoFile(otherConstants, fileDetails, true, (err, data) => {
                if (err) callback(err)
                else {
                    urls.videoInfo = converters.toObject(data) && data.videoData;
                    callback()
                }
            });
        }
    ],

        function (error) {
            if (error) {
                uploadLogger.error("upload image error :: ", error);
                callbackParent(error);
            }
            else {
                uploadLogger.info("upload image result :", urls);
                callbackParent(null, urls);
            }
        })
}

function saveCSVFile(fileData: any, path: string, callback: GenericServiceCallback) {
    copy(fileData, path).then((data) => callback(null, data)).catch((e) => callback(e));
}

export default {
    uploadProfilePicture: uploadProfilePicture,
    saveCSVFile: saveCSVFile,
    uploadfileWithoutThumbnail: uploadfileWithoutThumbnail,
    uploadVideoWithThumbnail: uploadVideoWithThumbnail
};