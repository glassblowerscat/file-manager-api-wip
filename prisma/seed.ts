import { PrismaClient } from "@prisma/client"
import { promises as fs } from "fs"
import { readFile, saveFile } from "../bucket/localBucket"
import { createFileRecord } from "../file"
import { generateFileName, generateId } from "../util/generators"
import { getMimeTypeFromExtension } from "../util/parsers"

export async function seed(): Promise<void> {
  const client = new PrismaClient()
  const existingRootDirectory = await client.directory.findFirst({
    where: { name: "root " },
  })
  const rootDirectory =
    existingRootDirectory ??
    (await client.directory.create({ data: { name: "root" } }))
  const filesDir = await fs.readdir(`${__dirname}/../../seed-files`)
  for (const file of filesDir) {
    if (file === ".DS_Store") {
      return
    }
    const name = generateFileName()
    const key = await generateId()
    const mimeType = getMimeTypeFromExtension(file)
    const buffer = await readFile(file)
    const size = buffer.byteLength
    await saveFile(key, {
      ContentLength: size,
      LastModified: new Date(),
      ContentType: mimeType,
      Body: buffer,
    })
    await createFileRecord(client, {
      name,
      key,
      directoryId: rootDirectory.id,
      mimeType,
      size,
    })
  }
  await client.$disconnect()
}
