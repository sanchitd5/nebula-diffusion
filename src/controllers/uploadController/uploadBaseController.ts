

/**
 * Please use appLogger for logging in this file try to abstain from console
 * levels of logging:
 * - TRACE - ‘blue’
 * - DEBUG - ‘cyan’
 * - INFO - ‘green’
 * - WARN - ‘yellow’
 * - ERROR - ‘red’
 * - FATAL - ‘magenta’
 */


import { GenericServiceCallback } from '../../definations';
import UploadManager from '../../lib/uploadManager';
import GenericController from "../GenericController";

class UploadBaseController extends GenericController {

  uploadImage = (payloadData: any, callback: GenericServiceCallback) => {
    let imageFileURL: any;
    const imageFile = payloadData.imageFile
    if (payloadData.imageFile && payloadData.imageFile.filename) {
      imageFileURL = {
        original: null,
        thumbnail: null
      }
    }
    global.appLogger.info("????????", this.utils.checkFileExtension(imageFile.hapi.filename))
    this.async.series([
      (cb) => {
        if (payloadData.hasOwnProperty("imageFile") && imageFile && imageFile.hapi.filename) {
          UploadManager.uploadProfilePicture(imageFile, this.config.AWS_S3_CONFIG.s3BucketCredentials.folder.image, this.utils.generateRandomString(), (err, uploadedInfo: any) => {
            if (this.convert.toError(err)) {
              cb(err)
            } else {
              imageFileURL = {
                original: uploadedInfo.profilePicture,
                thumbnail: uploadedInfo.profilePictureThumb
              }
              cb();
            }
          });
        }
        else {
          cb()
        }
      }
    ], function (err) {
      if (err) callback(err)
      else callback(null, { imageFileURL: imageFileURL })
    })
  }

  uploadVideo = (payloadData: any, callback: GenericServiceCallback) => {
    let videoFileURL: any;
    const videoFile = payloadData.videoFile
    if (payloadData.videoFile && payloadData.videoFile.filename) {
      videoFileURL = {
        original: null,
        thumbnail: null
      }
    }
    global.appLogger.info("????????", this.utils.checkFileExtension(videoFile.hapi.filename))
    this.async.series([
      (cb) => {
        if (payloadData.hasOwnProperty("videoFile") && videoFile && videoFile.hapi.filename) {
          UploadManager.uploadVideoWithThumbnail(videoFile, this.config.AWS_S3_CONFIG.s3BucketCredentials.folder.video, this.utils.generateRandomString(), (err, uploadedInfo) => {
            if (err) {
              cb(err)
            } else {

              videoFileURL = this.convert.toObject(uploadedInfo) && {
                original: uploadedInfo.videoFile,
                thumbnail: uploadedInfo.videoFileThumb,
                videoInfo: uploadedInfo.videoInfo
              }
              cb();
            }
          });
        }
        else {
          cb()
        }
      }
    ], (err: any) => {
      if (err) return callback(err)
      callback(null, { videoFileURL: videoFileURL })
    })
  }

  uploadDocument = (payloadData: any, callback: GenericServiceCallback) => {
    let documentFileUrl: any;
    const documentFile = payloadData.documentFile
    if (payloadData.documentFile && payloadData.documentFile.filename) {
      documentFileUrl = {
        original: null
      }
    }
    this.async.series([
      (cb) => {
        if (payloadData.hasOwnProperty("documentFile") && documentFile && documentFile.hapi.filename) {
          UploadManager.uploadfileWithoutThumbnail(documentFile, this.config.AWS_S3_CONFIG.s3BucketCredentials.folder.files, this.utils.generateRandomString(), (err, uploadedInfo) => {
            if (this.convert.toError(err)) {
              cb(err)
            } else {
              documentFileUrl = this.convert.toObject(uploadedInfo) && {
                original: uploadedInfo.docFile
              }
              cb();
            }
          });
        }
        else {
          cb()
        }
      }
    ], function (err) {
      if (err) return callback(err)
      callback(null, { documentFileUrl: documentFileUrl })
    })
  }
}


export default new UploadBaseController();
