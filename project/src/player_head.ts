import { Mesh, MeshBasicMaterial, Object3D } from 'three'
import { getSkin } from './armor'
import { commandFrameData, frameAmount } from './frames'
import { genBlockUVs } from './model_loader'
import { target, targetE } from './util'

export async function updateSkin(part: Object3D, name: string) {
    const child0 = part.children[0] as Mesh
    const child1 = part.children[1] as Mesh

    const mat0 = child0.material as MeshBasicMaterial
    const mat1 = child1.material as MeshBasicMaterial

    const skin = await getSkin(name)

    mat0.map.image = new Image()
    mat0.map.image.src = skin

    mat1.map = mat0.map

    if (mat0.map.image.complete) {
        mat0.map.needsUpdate = true

        child0.geometry.setAttribute('uv', genBlockUVs(0, mat0.map.image.height, 8, 8, 8, 64, mat0.map.image.height))
        child1.geometry.setAttribute('uv', genBlockUVs(32, mat0.map.image.height, 8, 8, 8, 64, mat0.map.image.height))
    } else {
        mat0.map.image.onload = function () {
            mat0.map.needsUpdate = true

            child0.geometry.setAttribute(
                'uv',
                genBlockUVs(0, mat0.map.image.height, 8, 8, 8, 64, mat0.map.image.height),
            )
            child1.geometry.setAttribute(
                'uv',
                genBlockUVs(32, mat0.map.image.height, 8, 8, 8, 64, mat0.map.image.height),
            )
        }
    }
}

export function adjustHeadPosition() {
    const size = 0.5938

    for (let frame = 0; frame < frameAmount; frame++) {
        for (const [partName, part] of Object.entries(commandFrameData[frame])) {
            if (partName.includes('player_head')) {
                if (part.rotation !== undefined) {
                    if (part.translation === undefined) {
                        part.translation = [0, 0, 0]
                    }

                    targetE.set(part.rotation[0], part.rotation[1], part.rotation[2], 'ZYX')
                    target.set(0, 1, 0)
                    target.applyEuler(targetE)
                    target.multiplyScalar(size / 2)

                    part.translation[0] += -target.x
                    part.translation[1] += -target.y
                    part.translation[2] += -target.z
                }
            }
        }
    }
}
