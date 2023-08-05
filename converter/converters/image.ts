import { Converter } from "./def"
import { randomUUID } from "crypto"
import { readFile,writeFile } from "fs/promises"
import {exec as execAsync} from 'child_process'
import { promisify } from "util"

const exec = promisify(execAsync)

export const PNG_TO_JPG:Converter = async(buf) => {
    const file  = randomUUID()
    await writeFile(`/tmp/${file}.png`,buf)

    await exec(`magick /tmp/${file}.png /tmp/${file}.jpg`)

    return readFile(`/tmp/${file}.jpg`)

}

PNG_TO_JPG.from='png'
PNG_TO_JPG.to='jpg'