import { Object3D } from 'three'
import { degToRad, radToDeg } from 'three/src/math/MathUtils'
import { applyHelmet } from './armor'
import {
    canChangeBlock,
    canRotateX,
    canRotateY,
    canRotateZ,
    canTranslateX,
    canTranslateY,
    canTranslateZ,
    canWearHelmet,
    highlightedPart,
    select,
} from './controls'
import { frameAmount, saveBlock, saveHelmet, saveNBT, saveRotation, saveTranslation, setFrameAmount } from './frames'
import { CubesObject, FramePart } from './interfaces'
import { resetPropertyInputOriginals, setPropertyNumber, setPropertyString } from './menu'
import { applyBlock } from './model_loader'
import {
    getBlockProperty,
    getHeadProperty,
    getNBTProperty,
    getRootObject,
    projectDescription,
    projectName,
    setProjectDescription,
    setProjectName,
} from './util'

// TODO make function lookup table as part of properties
export const propertyNames = {
    translatex: 'X Translation',
    translatey: 'Y Translation',
    translatez: 'Z Translation',
    rotatex: 'X Rotation',
    rotatey: 'Y Rotation',
    rotatez: 'Z Rotation',
    armorh: 'Helmet',
    projectname: 'Project Name',
    projectdesc: 'Project Description',
    frames: '# of Frames',
    nbt: 'Custom NBT',
    block: 'Block',
}

export function getHighlightedProperties() {
    const properties = []

    if (highlightedPart !== null) {
        if (canTranslateX) {
            properties.push('translatex')
        }
        if (canTranslateY) {
            properties.push('translatey')
        }
        if (canTranslateZ) {
            properties.push('translatez')
        }

        if (canRotateX) {
            properties.push('rotatex')
        }
        if (canRotateY) {
            properties.push('rotatey')
        }
        if (canRotateZ) {
            properties.push('rotatez')
        }

        if (canWearHelmet) {
            properties.push('armorh')
        }

        if (canChangeBlock) {
            properties.push('block')
        }

        if (highlightedPart.parent === getRootObject(highlightedPart)) {
            properties.push('nbt')
        }
    } else {
        properties.push('projectname')
        properties.push('projectdesc')
        properties.push('frames')
    }

    return properties
}

export async function previewPropertyValue(property: string, value: number | string) {
    if (typeof value === 'number') {
        if (property === 'rotatex') {
            highlightedPart.rotation.x = degToRad(value)
        }
        if (property === 'rotatey') {
            highlightedPart.rotation.y = degToRad(value)
        }
        if (property === 'rotatez') {
            highlightedPart.rotation.z = degToRad(value)
        }
        if (property === 'translatex') {
            highlightedPart.parent.position.x = value
        }
        if (property === 'translatey') {
            highlightedPart.parent.position.y = value
        }
        if (property === 'translatez') {
            highlightedPart.parent.position.z = value
        }
    } else if (typeof value === 'string') {
        if (property === 'armorh') {
            applyHelmet(highlightedPart, value)
        }
        if (property === 'block') {
            applyBlock(highlightedPart, value)
        }
    }
}

export function setPropertyValue(f: number, property: string, value: number | string) {
    if (typeof value === 'number') {
        if (property === 'rotatex') {
            saveRotation(f, highlightedPart, [degToRad(value), highlightedPart.rotation.y, highlightedPart.rotation.z])
        }
        if (property === 'rotatey') {
            saveRotation(f, highlightedPart, [highlightedPart.rotation.x, degToRad(value), highlightedPart.rotation.z])
        }
        if (property === 'rotatez') {
            saveRotation(f, highlightedPart, [highlightedPart.rotation.x, highlightedPart.rotation.y, degToRad(value)])
        }
        if (property === 'translatex') {
            saveTranslation(f, highlightedPart, [
                value,
                highlightedPart.parent.position.y,
                highlightedPart.parent.position.z,
            ])
        }
        if (property === 'translatey') {
            saveTranslation(f, highlightedPart, [
                highlightedPart.parent.position.x,
                value,
                highlightedPart.parent.position.z,
            ])
        }
        if (property === 'translatez') {
            saveTranslation(f, highlightedPart, [
                highlightedPart.parent.position.x,
                highlightedPart.parent.position.y,
                value,
            ])
        }
        if (property === 'frames') {
            setFrameAmount(value)
        }
    } else if (typeof value === 'string') {
        if (property === 'armorh') {
            saveHelmet(f, highlightedPart, value)
        }
        if (property === 'nbt') {
            saveNBT(f, highlightedPart, value)
        }
        if (property === 'block') {
            saveBlock(f, highlightedPart, value)
        }
        if (property === 'projectname') {
            setProjectName(value)
        }
        if (property === 'projectdesc') {
            setProjectDescription(value)
        }
    }

    previewPropertyValue(property, value)
}

export function getPropertyValue(property: string) {
    if (property === 'rotatex') {
        return radToDeg(highlightedPart.rotation.x)
    }
    if (property === 'rotatey') {
        return radToDeg(highlightedPart.rotation.y)
    }
    if (property === 'rotatez') {
        return radToDeg(highlightedPart.rotation.z)
    }
    if (property === 'translatex') {
        return highlightedPart.parent.position.x
    }
    if (property === 'translatey') {
        return highlightedPart.parent.position.y
    }
    if (property === 'translatez') {
        return highlightedPart.parent.position.z
    }
    if (property === 'armorh') {
        return getHeadProperty(highlightedPart)
    }
    if (property === 'nbt') {
        return getNBTProperty(highlightedPart)
    }
    if (property === 'block') {
        return getBlockProperty(highlightedPart)
    }
    if (property === 'projectname') {
        return projectName
    }
    if (property === 'projectdesc') {
        return projectDescription
    }
    if (property === 'frames') {
        return frameAmount
    }

    return 0
}

// TODO make every value keyframeable
export function updateKeyframeValues() {
    resetPropertyInputOriginals()

    const properties = getHighlightedProperties()

    for (let i = 0; i < properties.length; i++) {
        if (properties[i].startsWith('rotate') || properties[i].startsWith('translate')) {
            setPropertyNumber(properties[i], getPropertyValue(properties[i]) as number)
        }
        if (properties[i].startsWith('armor') || properties[i].startsWith('nbt') || properties[i].startsWith('block')) {
            setPropertyString(properties[i], getPropertyValue(properties[i]) as string)
        }
    }
}

export function loadKeyframeValues(part: Object3D, data: FramePart) {
    if (data.translation !== undefined) {
        part.parent.position.set(data.translation[0], data.translation[1], data.translation[2])
    }
    if (data.rotation !== undefined) {
        part.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2])
    }
    if (data.skullowner !== undefined) {
        applyHelmet(part, data.skullowner)
    }
    if (data.block !== undefined) {
        applyBlock(part, data.block)
    }
}

// TODO zombie villager acts funky and errors, figure out why
export function saveAllToFrame(f: number, root: CubesObject) {
    let part = root.cubes[0].parent
    select(part)

    for (const property of getHighlightedProperties()) {
        setPropertyValue(f, property, getPropertyValue(property))
    }

    for (const [, value] of Object.entries(root.children)) {
        saveAllToFrame(f, value)
    }
}
