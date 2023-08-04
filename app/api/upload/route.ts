import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";
import { extname } from "path";
import * as AWS from 'aws-sdk';

import {v4 as uuid} from 'uuid'



AWS.config.update({
    region:process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  

const bucket = process.env.S3_BUCKET_NAME!


export async function POST(req:NextRequest) {

    const data = await req.formData()
    const file: File | null = data.get('file') as unknown as File
    const to = data.get('to') as string
    const from = extname(file.name).replace('.', '')

    if (!file) {
      return new NextResponse(JSON.stringify({ error:"no file found here" }), {
        status:400
      })
    }
  
    if (!to) {
        return new NextResponse(JSON.stringify({ error:"no to found here" }), {
          status:400
        })
      }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)




    const key = `${uuid()}.${from}`
    const s3 = new AWS.S3();

    const params = {
        Bucket: bucket,
        Key: key, // File name you want to save as in S3
        Body: buffer
      };
    

        const uploadResponse = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${uploadResponse.Location}`);


    const conversion = await prisma.conversion.create({
        data: {
            fileLocation:`s3://${bucket}/${key}`,
            from,
            to,
            current:from,
            status:Status.PENDING
        }
    })

    
    return  NextResponse.json({id:conversion.id})
}