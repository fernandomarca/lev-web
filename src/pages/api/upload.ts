import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File } from 'formidable'
import fs from 'fs'

const form = formidable({ multiples: true })

const isFile = (file: File | File[]): file is File => !Array.isArray(file) && file.filepath !== undefined

type Data = {
  message?: string
} | any[]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const fileContent: string = await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) {
          return reject(err)
        }
        //@ts-ignore
        if (isFile(files.file)) {
          const fileContentBuffer = fs.readFileSync(files.file.filepath)
          const fileContentReadable = fileContentBuffer.toString('utf8')
          return resolve(fileContentReadable)
        }
        reject(new Error('No file found'))
      })
    })
    console.log(fileContent)
    res.status(200).send({ message: 'ok' })
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: 'Bad Request' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}