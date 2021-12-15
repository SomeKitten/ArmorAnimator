import { map } from 'lodash'
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, NearestFilter, Object3D, Texture } from 'three'
import { CubesObject } from './interfaces'
import { genBlockUVs } from './model_loader'
import { updateSkin } from './player_head'
import { createTransparentMaterial } from './render'
import { cubes, getChild, getCubesObject, getRootObject, isUrlFound, memoizer } from './util'

let currentHead = ''

// TODO display armor/items on armorstand
// TODO adjust zombie villager hat height
export async function applyHelmet(part: Object3D, name: string) {
    if (part.name.includes('player_head')) {
        updateSkin(part, name)
    } else {
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
    if (name !== '') {
        // TODO allow textures.minecraft.net link
        const skin = await getSkin(name)

        // TODO fix old opaque hat-layer skins (e.g. Notch), they show up as black
        // ! MAGIC NUMBERS LMAOO (THANKS MOJANG)
        const layer1Size = 0.5938
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

        layer1Mesh.name = part.name + '|head_' + name

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
}

export let getSkin: Function

export let skinCache = {}
export function initArmor() {
    getSkin = memoizer(async function (name: string) {
        console.log(name)

        const data = await fetch('https://api.ashcon.app/mojang/v2/user/' + name).then((res) => res.json())

        if (data.code === undefined) {
            return 'data:image/png;base64,' + data.textures.skin.data
        }

        return await getSkin('MHF_Steve')
    })
}
