import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, NearestFilter, Object3D, Texture } from 'three'
import { CubesObject } from './interfaces'
import { genBlockUVs } from './model_loader'
import { cubes, getChild, getCubesObject, getRootObject, memoizer } from './util'

let currentHead = ''

// TODO display armor/items on armorstand
// TODO adjust zombie villager hat height
export async function applyHelmet(part: Object3D, name: string) {
    currentHead = name

    const playerHead = await getHead(part, name)

    if (currentHead === name) {
        if (playerHead !== null) {
            applyPlayerHead(part, playerHead)
        } else {
            const dummy = new Object3D()
            dummy.name = part.name + '|head_' + name

            applyPlayerHead(part, dummy)
        }
    }
}

function applyPlayerHead(part: Object3D, playerHead: Object3D) {
    part.children = part.children.filter((obj, i, arr) => !obj.name.startsWith(part.name + '|head_'))
    cubes.parts = cubes.parts.filter((obj, i, arr) => !obj.name.startsWith(part.name + '|head_'))

    part.add(playerHead)
    cubes.parts.push(playerHead)

    const highlightedNameParts = part.name.split('|')
    const highlightedNameBase = highlightedNameParts[highlightedNameParts.length - 1]
    const rootName = getRootObject(part).name
    const root = getChild(cubes[rootName])

    const highlightedCubesObject = getCubesObject(root as CubesObject, highlightedNameBase)
    const helmetCubesObject = {
        children: {},
        cubes: [playerHead],
    }

    highlightedCubesObject.children = {
        [playerHead.name]: helmetCubesObject,
    }
}

export async function getHead(part: Object3D, name: string) {
    console.log('getHead', name)

    if (name !== '') {
        // TODO allow textures.minecraft.net link
        const head = await getSkin('https://api.ashcon.app/mojang/v2/user/' + name)

        if (head !== null) {
            head.name = part.name + '|head_' + name
            return head
        }
    }
    return null
}

export let getSkin: Function

export let headCache = {}
export function initArmor() {
    getSkin = memoizer(async function (url: string) {
        // TODO fix old opaque hat-layer skins (e.g. Notch), they show up as black
        // ! MAGIC NUMBERS LMAOO (THANKS MOJANG)
        const blockPixelSize = 1 / 16
        const layer1Size = 0.074
        const layer2Size = layer1Size * (9 / 8)
        const blockToLayer1 = layer1Size / blockPixelSize // replace
        const blockToLayer2 = layer2Size / blockPixelSize // replace
        const layer2ToLayer1 = layer1Size / layer2Size
        const layer1Scale = (1 / 2) * blockToLayer1
        const layer2Scale = (1 / 2) * blockToLayer2

        const data = await fetch(url).then((res) => res.json())

        if (!data.code) {
            let cubeImage = new Image()
            cubeImage.src = 'data:image/png;base64,' + data.textures.skin.data

            let cubeTexture = new Texture()
            cubeTexture.image = cubeImage
            cubeImage.onload = function () {
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

            cubeTexture.minFilter = NearestFilter
            cubeTexture.magFilter = NearestFilter
            const layer1 = new BoxGeometry(1, 1, 1)
            layer1.translate(0, 0.5, 0)
            layer1.scale(layer1Scale, layer1Scale, layer1Scale)
            const layer1Material = new MeshBasicMaterial({ map: cubeTexture })
            const layer1Mesh = new Mesh(layer1, layer1Material)

            const layer2 = new BoxGeometry(1, 1, 1)
            layer2.translate(0, 0.5 * layer2ToLayer1, 0)
            layer2.scale(layer2Scale, layer2Scale, layer2Scale)
            // TODO create variable for transparent material settings
            // TODO research into semi-transparent textures
            const layer2Material = new MeshBasicMaterial({
                color: 0xffffff,
                map: cubeTexture,
                transparent: false,
                alphaTest: 0.5,
                depthWrite: true,
                depthTest: true,
                side: DoubleSide,
            })
            const layer2Mesh = new Mesh(layer2, layer2Material)

            layer1Mesh.add(layer2Mesh)

            return layer1Mesh
        } else {
            return null
        }
    })
}
