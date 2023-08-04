import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import * as AWS from 'aws-sdk';
import { Readable } from "stream";
import { Status } from "@prisma/client";



AWS.config.update({
    region:process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  

const bucket = process.env.S3_BUCKET_NAME!

export async function GET(req:NextRequest,{params}:{params:{id:string}}) {
    const conversion = await prisma.conversion.findUnique({
        where: {
            id:params.id
        }
    })


    if(!conversion) {
        return new NextResponse(JSON.stringify({error:"No id found"}), {
            status:404
        })


    }    


    if(conversion.status !== Status.DONE) {
        return new NextResponse(JSON.stringify({error:"File hasnt finished being converted"}), {
            status:400
        })

    }
    
    
    const s3 = new AWS.S3();

    const downloadParams = {
        Bucket: bucket,
        Key: conversion.fileLocation.replace(`s3://${bucket}/`,''), // File name you want to save as in S3

      };
    

    const stream =  Readable.toWeb(s3.getObject(downloadParams).createReadStream())

    return new NextResponse(stream as any, {
        headers: {
            'Content-Type':`image/${conversion.to}`,
            'Content-Disposition':`attachment; filename=download.${conversion.to}`
        }
    })

    return 
}