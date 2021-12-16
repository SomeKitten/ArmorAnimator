import { BoxGeometry, Mesh, MeshBasicMaterial, NearestFilter, Object3D, Texture } from 'three'
import { commandFrameData, frameAmount } from './frames'
import { genBlockUVs } from './model_loader'
import { createTransparentMaterial, transparentTexture } from './render'
import { cubes, isUrlFound, memoizer, target, targetE } from './util'

export const headSize = 0.5938

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
        child.geometry.translate(0, headSize / 2, 0)
        child.geometry.scale(9 / 8, 9 / 8, 9 / 8)

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
                    part.translation[1] += -1.641646
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

export let getHeadSkin = memoizer(async function (name: string) {
    if (name !== '') {
        // TODO allow textures.minecraft.net link
        const skin = await getSkin(name)

        // TODO fix old opaque hat-layer skins (e.g. Notch), they show up as black
        // ! MAGIC NUMBERS LMAOO (THANKS MOJANG)
        const layer1Size = headSize
        const layer2Size = layer1Size * (9 / 8)

        let cubeTexture = new Texture()
        cubeTexture.image = new Image()
        cubeTexture.image.src = skin

        cubeTexture.minFilter = NearestFilter
        cubeTexture.magFilter = NearestFilter
        const layer1 = new BoxGeometry(1, 1, 1)
        layer1.translate(0, 0.5, 0)
        layer1.scale(layer1Size, layer1Size, layer1Size)
        const layer1Material = new MeshBasicMaterial({ map: cubeTexture })
        const layer1Mesh = new Mesh(layer1, layer1Material)

        const layer2 = new BoxGeometry(1, 1, 1)
        layer2.scale(layer2Size, layer2Size, layer2Size)
        layer2.translate(0, layer1Size / 2, 0)
        // TODO research into semi-transparent textures
        const layer2Material = createTransparentMaterial(cubeTexture)
        const layer2Mesh = new Mesh(layer2, layer2Material)

        layer1Mesh.add(layer2Mesh)

        if (cubeTexture.image.complete) {
            cubeTexture.needsUpdate = true

            layer1.setAttribute('uv', genBlockUVs(0, cubeTexture.image.height, 8, 8, 8, 64, cubeTexture.image.height))
            layer2.setAttribute('uv', genBlockUVs(32, cubeTexture.image.height, 8, 8, 8, 64, cubeTexture.image.height))
        } else {
            cubeTexture.image.onload = function () {
                cubeTexture.needsUpdate = true

                layer1.setAttribute(
                    'uv',
                    genBlockUVs(0, cubeTexture.image.height, 8, 8, 8, 64, cubeTexture.image.height),
                )
                layer2.setAttribute(
                    'uv',
                    genBlockUVs(32, cubeTexture.image.height, 8, 8, 8, 64, cubeTexture.image.height),
                )
            }
        }

        return layer1Mesh
    }

    return null
})

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

            const blob = await fetch(url).then((r) => r.blob())
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            })

            return dataUrl
        } else {
            const data = await fetch('https://api.ashcon.app/mojang/v2/user/' + name).then((res) => res.json())

            if (data.code === undefined) {
                return 'data:image/png;base64,' + data.textures.skin.data
            }
        }

        return await getSkin('MHF_Steve')
    })
}
