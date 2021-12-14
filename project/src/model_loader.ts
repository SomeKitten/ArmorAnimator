import {
    BoxGeometry,
    BufferAttribute,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Object3D,
    PlaneGeometry,
    Texture,
} from 'three'
import { camOrbit } from './camera'
import { select } from './controls'
import { frameData, setFrame } from './frames'

import { CubesChildren, CubesObject, Frame, FramePart, Json, ModelPart, ModelShape } from './interfaces'
import { initProperties } from './properties'
import { createTransparentMaterial, textureLoader } from './render'
import { settings } from './settings'
import { scene, cubes, getChild, getAllModels, memoizer, isUrlFound } from './util'

let scaleFactor = 1 / 16
export let models: string[] = []

export let modelCount = 0

export function setModelCount(count: number) {
    modelCount = count
}

// NEXT make all search names valid Java Edition entities
export function loadModelList() {
    getAllModels().then((list: string[]) => {
        models = list
    })
}

export function genBlockUVs(u: number, v: number, x: number, y: number, z: number, texturew: number, textureh: number) {
    // bl, br, tl, tr
    let top = [
        [u + z, v],
        [u + z + x, v],
        [u + z, v - z],
        [u + z + x, v - z],
    ]

    let bottom = [
        [u + z + x, v - z],
        [u + z + x + x, v - z],
        [u + z + x, v],
        [u + z + x + x, v],
    ]

    let right = [
        [u, v - z],
        [u + z, v - z],
        [u, v - z - y],
        [u + z, v - z - y],
    ]

    let front = [
        [u + z, v - z],
        [u + x + z, v - z],
        [u + z, v - z - y],
        [u + x + z, v - z - y],
    ]

    let left = [
        [u + z + x, v - z],
        [u + z + z + x, v - z],
        [u + z + x, v - z - y],
        [u + z + z + x, v - z - y],
    ]

    let back = [
        [u + z + x + z, v - z],
        [u + z + x + z + x, v - z],
        [u + z + x + z, v - z - y],
        [u + z + x + z + x, v - z - y],
    ]

    const uvs_all = []

    for (const uv of left) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }
    for (const uv of right) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }
    for (const uv of top) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }
    for (const uv of bottom) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }
    for (const uv of front) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }
    for (const uv of back) {
        uvs_all.push(uv[0] / texturew)
        uvs_all.push(uv[1] / textureh)
    }

    for (let i = 0; i < uvs_all.length; i += 8) {
        while (uvs_all[i] > 1 || uvs_all[i + 2] > 1 || uvs_all[i + 4] > 1 || uvs_all[i + 6] > 1) {
            uvs_all[i] -= 1
            uvs_all[i + 2] -= 1
            uvs_all[i + 4] -= 1
            uvs_all[i + 6] -= 1
        }

        while (uvs_all[i + 1] > 1 || uvs_all[i + 3] > 1 || uvs_all[i + 5] > 1 || uvs_all[i + 7] > 1) {
            uvs_all[i + 1] -= 1
            uvs_all[i + 3] -= 1
            uvs_all[i + 5] -= 1
            uvs_all[i + 7] -= 1
        }

        while (uvs_all[i] < 0 || uvs_all[i + 2] < 0 || uvs_all[i + 4] < 0 || uvs_all[i + 6] < 0) {
            uvs_all[i] += 1
            uvs_all[i + 2] += 1
            uvs_all[i + 4] += 1
            uvs_all[i + 6] += 1
        }

        while (uvs_all[i + 1] < 0 || uvs_all[i + 3] < 0 || uvs_all[i + 5] < 0 || uvs_all[i + 7] < 0) {
            uvs_all[i + 1] += 1
            uvs_all[i + 3] += 1
            uvs_all[i + 5] += 1
        }
    }

    return new BufferAttribute(new Float32Array(uvs_all), 2)
}

function genBlockChild(shape: ModelShape, texture: Texture, textureSize: number[]) {
    const geometry = new BoxGeometry()
    const material = createTransparentMaterial(texture)

    let size = [shape.to[0] - shape.from[0], shape.to[1] - shape.from[1], shape.to[2] - shape.from[2]]

    let generated = genBlockUVs(
        shape.uv[0] - size[2],
        textureSize[1] - (shape.uv[1] - size[2]),
        size[0],
        size[1],
        size[2],
        textureSize[0],
        textureSize[1],
    )

    geometry.setAttribute('uv', generated)

    geometry.applyMatrix4(new Matrix4().makeScale(size[0] * scaleFactor, size[1] * scaleFactor, size[2] * scaleFactor))

    geometry.applyMatrix4(
        new Matrix4().makeTranslation(
            shape.from[0] * scaleFactor,
            shape.from[1] * scaleFactor,
            shape.from[2] * scaleFactor,
        ),
    )

    geometry.applyMatrix4(
        new Matrix4().makeTranslation(
            (size[0] / 2) * scaleFactor,
            (size[1] / 2) * scaleFactor,
            (size[2] / 2) * scaleFactor,
        ),
    )

    if (shape.rotation !== undefined) {
        geometry.applyMatrix4(new Matrix4().makeRotationZ((shape.rotation[2] / 180) * Math.PI))
        geometry.applyMatrix4(new Matrix4().makeRotationY((shape.rotation[1] / 180) * Math.PI))
        geometry.applyMatrix4(new Matrix4().makeRotationX((shape.rotation[0] / 180) * Math.PI))
    }

    if (shape.position !== undefined) {
        geometry.applyMatrix4(
            new Matrix4().makeTranslation(
                shape.position[0] * scaleFactor,
                shape.position[1] * scaleFactor,
                shape.position[2] * scaleFactor,
            ),
        )
    }

    return new Mesh(geometry, material)
}

function genPlaneUVs(u: number, v: number, w: number, h: number, textureSize: number[]) {
    let uvs = [u, v, u + w, v, u, v - h, u + w, v - h]

    for (let i = 0; i < uvs.length; i++) {
        if (i % 2 == 1) {
            uvs[i] = uvs[i] / textureSize[1]
        } else {
            uvs[i] = uvs[i] / textureSize[0]
        }
    }

    return new BufferAttribute(new Float32Array(uvs), 2)
}

function genPlaneChild(shape: ModelShape, texture: Texture, textureSize: number[]) {
    const geometry = new PlaneGeometry()
    const material = createTransparentMaterial(texture)

    let size = [shape.to[0] - shape.from[0], shape.to[1] - shape.from[1], shape.to[2] - shape.from[2]]

    let generated = genPlaneUVs(shape.uv[0], textureSize[1] - shape.uv[1], size[0], size[1], textureSize)

    geometry.setAttribute('uv', generated)

    geometry.applyMatrix4(new Matrix4().makeScale(size[0] * scaleFactor, size[1] * scaleFactor, size[2] * scaleFactor))

    geometry.applyMatrix4(
        new Matrix4().makeTranslation(
            shape.from[0] * scaleFactor,
            shape.from[1] * scaleFactor,
            shape.from[2] * scaleFactor,
        ),
    )

    geometry.applyMatrix4(new Matrix4().makeTranslation((size[0] / 2) * scaleFactor, (size[1] / 2) * scaleFactor, 0))

    if (shape.rotation !== undefined) {
        geometry.applyMatrix4(new Matrix4().makeRotationZ((shape.rotation[2] / 180) * Math.PI))
        geometry.applyMatrix4(new Matrix4().makeRotationY((shape.rotation[1] / 180) * Math.PI))
        geometry.applyMatrix4(new Matrix4().makeRotationX((shape.rotation[0] / 180) * Math.PI))
    }

    if (shape.position !== undefined) {
        geometry.applyMatrix4(
            new Matrix4().makeTranslation(
                shape.position[0] * scaleFactor,
                shape.position[1] * scaleFactor,
                shape.position[2] * scaleFactor,
            ),
        )
    }

    return new Mesh(geometry, material)
}

function skipPart(part: ModelPart) {
    if (part.name === 'saddle' || part.name === 'chests' || part.name === 'halter' || part.name.endsWith('rein')) {
        return true
    }
    return false
}

// TODO make type for mimodel data
// TDOO load textures from https://launcher.mojang.com/v1/objects/7e46fb47609401970e2818989fa584fd467cd036/client.jar (or whatever is the latest version JAR on that site)
async function loadMimodel(currentFrame: Frame, data: Json, identifier?: string) {
    // ? allow only one root element (so legs don't break things on chickens, zombies, and others)
    while ((data.parts as Json[]).length > 1) {
        const movePart = data.parts[(data.parts as Json[]).length - 1]
        ;(data.parts[0].parts as Json[]).push(movePart)

        movePart.position[0] -= data.parts[0].position[0]
        movePart.position[1] -= data.parts[0].position[1]
        movePart.position[2] -= data.parts[0].position[2]
        ;(data.parts as Json[]).splice((data.parts as Json[]).length - 1, 1)
    }

    const texture = textureLoader.load('textures/' + data.texture + '.png')
    texture.generateMipmaps = false
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter

    identifier = identifier || data.name + '|' + modelCount

    let parts = data.parts as unknown as ModelPart[]

    let root = new Object3D()
    root.name = identifier
    scene.add(root)

    cubes[identifier] = await parseParts(currentFrame, identifier, texture, data, root, parts)

    return identifier
}

async function parseParts(
    currentFrame: Frame,
    identifier: string,
    texture: Texture,
    data: Json,
    parent: Object3D,
    parts: ModelPart[],
) {
    let textureSize = data.texture_size as number[]

    let returnParts: CubesChildren = {}

    for (let i = 0; i < parts.length; i++) {
        let part = parts[i]

        if (skipPart(part)) {
            continue
        }

        let returnPart: CubesObject = {
            children: {},
            cubes: [],
        }

        let framePart: FramePart = {}

        let root = new Object3D()
        root.rotation.order = 'ZYX'

        root.position.set(
            part.position[0] * scaleFactor,
            part.position[1] * scaleFactor,
            part.position[2] * scaleFactor,
        )

        if (part.rotation !== undefined) {
            root.rotation.set(
                (part.rotation[0] / 180) * Math.PI,
                (part.rotation[1] / 180) * Math.PI,
                (part.rotation[2] / 180) * Math.PI,
            )
            framePart.rotation = [
                (part.rotation[0] / 180) * Math.PI,
                (part.rotation[1] / 180) * Math.PI,
                (part.rotation[2] / 180) * Math.PI,
            ]
        } else {
            framePart.rotation = [0, 0, 0]
        }

        root.name = identifier + '|' + part.name

        currentFrame[identifier + '|' + part.name] = framePart

        if (part.shapes !== undefined) {
            for (let shape of part.shapes) {
                if (shape.description !== undefined || shape.invert || shape.texture !== undefined) {
                    continue
                }

                let child = null

                if (shape.type == 'block') {
                    child = genBlockChild(shape, texture, textureSize)
                } else {
                    child = genPlaneChild(shape, texture, textureSize)
                }

                child.name = root.name + '|' + shape.type

                root.add(child)
                cubes.parts.push(child)
                returnPart.cubes.push(child)
            }
        }

        if (part.parts !== undefined) {
            returnPart.children = await parseParts(currentFrame, identifier, texture, data, root, part.parts)
        } else {
            returnPart.children = {}
        }

        returnParts[part.name] = returnPart

        parent.add(root)
    }

    return returnParts
}

export async function loadModel(p: string, identifier?: string) {
    let regex = /\,(?=\s*?[\}\]])/g
    let correct = (await (await fetch(p)).text()).replace(regex, '')

    let data = JSON.parse(correct)

    let newIdentifier = await loadMimodel(frameData[-1], data, identifier)

    identifier = newIdentifier

    cubes.models[identifier] = p

    const splitted = p.split('/')
    const name = splitted[splitted.length - 1].slice(0, -8)

    const settingsText = await (await fetch('/settings/' + name + '.json')).text()
    if (settingsText !== '') {
        settings[identifier.split('|')[0]] = JSON.parse(settingsText)
    }

    setFrame(0)

    const root = scene.getObjectByName(identifier)

    root.position.set(camOrbit.x, camOrbit.y, camOrbit.z)

    select(root.children[0])
    initProperties(root.children[0])

    modelCount++
}

// TODO apply block model and texture
// TODO memoize this
export let blockTexture: Function

export function initModelLoader() {
    const sand = textureLoader.load('textures/block/sand.png')
    sand.minFilter = NearestFilter
    sand.magFilter = NearestFilter

    blockTexture = memoizer(async function (block: string) {
        return (await isUrlFound('textures/block/' + block + '.png'))
            ? textureLoader.load('textures/block/' + block + '.png')
            : sand
    })
}

export async function applyBlock(part: Object3D, block: String) {
    const texture = await blockTexture(block)

    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    ;((part.children[0] as Mesh).material as MeshBasicMaterial).map = texture
}
