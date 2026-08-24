import convert from 'obj2gltf'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = '/tmp/opencode/pistolvibe/gunpack/OBJ'
const out = '/tmp/opencode/pistolvibe/glb'

for (const f of readdirSync(dir).filter((x) => x.endsWith('.obj'))) {
  const name = f.replace('.obj', '')
  const objData = readFileSync(join(dir, f))
  const options = {
    resourceDirectory: dir,
    materialsBase: dir,
    texturesBase: dir,
    metallicRoughness: true,
    specularGlossiness: false,
  }
  try {
    const glb = await convert(objData, options)
    writeFileSync(`${out}/${name}.glb`, Buffer.from(glb))
    console.log('ok', name, (glb.length / 1024).toFixed(1) + 'KB')
  } catch (e) {
    console.error('fail', name, e.message)
  }
}
