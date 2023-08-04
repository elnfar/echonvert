import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";



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

    return NextResponse.json({status:conversion.status})
}