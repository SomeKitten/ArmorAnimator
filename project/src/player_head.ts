import { BoxGeometry, Mesh, MeshBasicMaterial, NearestFilter, Object3D, Texture } from 'three'
import { commandFrameData, frameAmount } from './frames'
import { genBlockUVs } from './model_loader'
import { createTransparentMaterial, transparentTexture } from './render'
import { cubes, getDataURL, isUrlFound, memoizer, target, targetE } from './util'

export const headSize = 0.593708

let currentHead = ''

export async function updateSkin(part: Object3D, name: string) {
    if (part.children.length < 2) {
        const texture = new Texture()
        texture.generateMipmaps = false
        texture.minFilter = NearestFilter
        texture.magFilter = NearestFilter

        let child = new Mesh()
        child.name = part.name + '|player_head'
        child.material = createTransparentMaterial(texture)
        child.geometry = new BoxGeometry(headSize, headSize, headSize)
        child.geometry.translate(0, headSize / 2, 0)

        part.add(child)
        cubes.parts.push(child)

        child = new Mesh()
        child.name = part.name + '|player_head_overlay'
        child.material = createTransparentMaterial(texture)
        child.geometry = new BoxGeometry(headSize, headSize, headSize)
        child.geometry.scale(9 / 8, 9 / 8, 9 / 8)
        child.geometry.translate(0, headSize / 2, 0)

        part.add(child)
        cubes.parts.push(child)
    }

    let child0 = part.children[0] as Mesh
    let child1 = part.children[1] as Mesh

    if (part.children.length > 2) {
        child0 = part.children[1] as Mesh
        child1 = part.children[2] as Mesh
    }

    const mat0 = child0.material as MeshBasicMaterial
    const mat1 = child1.material as MeshBasicMaterial

    currentHead = name

    const skin = await getSkin(name)

    if (currentHead !== name) {
        return
    }

    if (!part.name.includes('player_head') && name === '') {
        mat0.map.needsUpdate = true

        mat0.map.image = transparentTexture.image
        mat1.map.image = transparentTexture.image

        return
    }

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

export function adjustHead() {
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
                    target.multiplyScalar(headSize / 2)

                    part.translation[0] += -target.x
                    part.translation[1] += -target.y
                    part.translation[2] += -target.z
                }
                if (part.translation !== undefined) {
                    part.translation[1] += -1.4385
                }
                if (part.skullowner !== undefined) {
                    if (typeof part.skullowner === 'string' && part.skullowner.includes('textures.minecraft.net')) {
                        if (!part.skullowner.startsWith('http')) {
                            part.skullowner = 'http://' + part.skullowner
                        }

                        part.skullowner = {
                            Id: '[I;-1491382499,-1872148926,-1077879531,283117985]',
                            Properties: {
                                textures: [
                                    {
                                        Value: btoa(`{"textures":{"SKIN":{"url":"${part.skullowner}"}}}`),
                                    },
                                ],
                            },
                        }
                    }
                }
            }
        }
    }
}

// TODO display armor/items on armorstand
// TODO adjust zombie villager hat height
export async function applyHelmet(part: Object3D, name: string) {
    updateSkin(part, name)
}

const defaultDataURL =
    'data:image/png;base64,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'

export let getSkin: Function

export function initPlayerHead() {
    getSkin = memoizer(async function (name: string) {
        if (name.includes('textures.minecraft.net')) {
            const myHeaders = new Headers()
            myHeaders.append('Access-Control-Allow-Origin', '*')
            myHeaders.append('X-Custom-Header', 'ProcessThisImmediately')

            let url = name
            if (!(url.startsWith('http://') || url.startsWith('https://'))) {
                url = 'http://' + url
            }

            url = 'http://108.5.174.236:25564/proxy/' + url

            if (!(await isUrlFound(url))) {
                return await getSkin('MHF_Steve')
            }

            return await getDataURL(url)
        } else {
            const dataURL = await getDataURL('https://mc-heads.net/skin/' + name)

            if (dataURL === defaultDataURL) {
                return await getDataURL('https://mc-heads.net/skin/MHF_Steve')
            }

            return dataURL
        }
    })
}
