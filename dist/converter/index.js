"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const AWS = __importStar(require("aws-sdk"));
const image_1 = require("./converters/image");
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const bucket = process.env.S3_BUCKET_NAME;
const convert = async (c) => {
    const s3 = new AWS.S3();
    const downloadParams = {
        Bucket: bucket,
        Key: c.fileLocation.replace(`s3://${bucket}/`, ''), // File name you want to save as in S3
    };
    const res = await s3.getObject(downloadParams).promise();
    const converted = await (0, image_1.PNG_TO_JPG)(res.Body);
    const key = c.fileLocation.replace(`s3://${bucket}/`, '').replace('.png', '.jpg');
    const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: converted
    };
    await s3.upload(uploadParams).promise();
    await prisma_1.prisma.conversion.update({
        where: {
            id: c.id,
        },
        data: {
            status: client_1.Status.DONE,
            fileLocation: `s3://${bucket}/${key}`,
            current: 'jpg'
        }
    });
};
const main = async () => {
    const conversions = await prisma_1.prisma.conversion.findMany({
        where: {
            status: client_1.Status.PENDING
        }
    });
    for (const conversion of conversions) {
        await convert(conversion);
    }
};
const loop = async () => {
    while (true) {
        await main();
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
};
loop();
