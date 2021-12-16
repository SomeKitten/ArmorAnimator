import { Object3D } from 'three'
import { degToRad, radToDeg } from 'three/src/math/MathUtils'
import { highlightedPart, setHighlightedPart } from './controls'
import { frameAmount, saveBlock, saveHelmet, saveNBT, saveRotation, saveTranslation, setFrameAmount } from './frames'
import { FramePart } from './interfaces'
import { setPropertyNumber, setPropertyString } from './menu'
import { applyBlock } from './model_loader'
import { applyHelmet } from './player_head'
import { getSetting, settingsPart } from './settings'
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

export class Property {
    displayName: string
    type: 'string' | 'number' | 'boolean'

    element: HTMLInputElement

    preview: (value: any) => void
    set: (f: number, value: any) => void
    get: () => any
    enabled: () => boolean
    constructor(
        displayName: string,
        type: 'string' | 'number' | 'boolean',
        preview: (value: any) => void,
        set: (f: number, value: any) => void,
        get: () => any,
        enabled: () => boolean,
    ) {
        this.displayName = displayName
        this.type = type
        this.preview = preview
        this.set = set
        this.get = get
        this.enabled = enabled
    }
}

export const properties: { [key: string]: Property } = {
    translatex: new Property(
        'X Translation',
        'number',
        (value: number) => {
            highlightedPart.parent.position.x = value
        },
        (f: number, value: number) => {
            saveTranslation(f, highlightedPart, [
                value,
                highlightedPart.parent.position.y,
                highlightedPart.parent.position.z,
            ])
        },
        () => {
            return highlightedPart.parent.position.x
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.translate', settingsPart.split('|')[2]).includes('X')
            )
        },
    ),
    translatey: new Property(
        'Y Translation',
        'number',
        (value: number) => {
            highlightedPart.parent.position.y = value
        },
        (f: number, value: number) => {
            saveTranslation(f, highlightedPart, [
                highlightedPart.parent.position.x,
                value,
                highlightedPart.parent.position.z,
            ])
        },
        () => {
            return highlightedPart.parent.position.y
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.translate', settingsPart.split('|')[2]).includes('Y')
            )
        },
    ),
    translatez: new Property(
        'Z Translation',
        'number',
        (value: number) => {
            highlightedPart.parent.position.z = value
        },
        (f: number, value: number) => {
            saveTranslation(f, highlightedPart, [
                highlightedPart.parent.position.x,
                highlightedPart.parent.position.y,
                value,
            ])
        },
        () => {
            return highlightedPart.parent.position.z
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.translate', settingsPart.split('|')[2]).includes('Z')
            )
        },
    ),
    rotatex: new Property(
        'X Rotation',
        'number',
        (value: number) => {
            highlightedPart.rotation.x = degToRad(value)
        },
        (f: number, value: number) => {
            saveRotation(f, highlightedPart, [degToRad(value), highlightedPart.rotation.y, highlightedPart.rotation.z])
        },
        () => {
            return radToDeg(highlightedPart.rotation.x)
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.rotate', settingsPart.split('|')[2]).includes('X')
            )
        },
    ),
    rotatey: new Property(
        'Y Rotation',
        'number',
        (value: number) => {
            highlightedPart.rotation.y = degToRad(value)
        },
        (f: number, value: number) => {
            saveRotation(f, highlightedPart, [highlightedPart.rotation.x, degToRad(value), highlightedPart.rotation.z])
        },
        () => {
            return radToDeg(highlightedPart.rotation.y)
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.rotate', settingsPart.split('|')[2]).includes('Y')
            )
        },
    ),
    rotatez: new Property(
        'Z Rotation',
        'number',
        (value: number) => {
            highlightedPart.rotation.z = degToRad(value)
        },
        (f: number, value: number) => {
            saveRotation(f, highlightedPart, [highlightedPart.rotation.x, highlightedPart.rotation.y, degToRad(value)])
        },
        () => {
            return radToDeg(highlightedPart.rotation.z)
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'freedom.rotate', settingsPart.split('|')[2]).includes('Z')
            )
        },
    ),
    armorh: new Property(
        'Helmet',
        'string',
        (value: string) => {
            applyHelmet(highlightedPart, value)
        },
        (f: number, value: string) => {
            saveHelmet(f, highlightedPart, value)
        },
        () => {
            return getHeadProperty(highlightedPart)
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'armor', settingsPart.split('|')[2]).includes('H')
            )
        },
    ),
    nbt: new Property(
        'Custom NBT',
        'string',
        (value: string) => {},
        (f: number, value: string) => {
            saveNBT(f, highlightedPart, value)
        },
        () => {
            return getNBTProperty(highlightedPart)
        },
        () => {
            return highlightedPart !== null && highlightedPart.parent === getRootObject(highlightedPart)
        },
    ),
    block: new Property(
        'Block',
        'string',
        (value: string) => {
            applyBlock(highlightedPart, value)
        },
        (f: number, value: string) => {
            saveBlock(f, highlightedPart, value)
        },
        () => {
            return getBlockProperty(highlightedPart)
        },
        () => {
            return (
                highlightedPart !== null &&
                getSetting(settingsPart.split('|')[0], 'block', settingsPart.split('|')[2]).includes('B')
            )
        },
    ),
    projectname: new Property(
        'Project Name',
        'string',
        (value: string) => {},
        (f: number, value: string) => {
            setProjectName(value)
        },
        () => {
            return projectName
        },
        () => {
            return highlightedPart === null
        },
    ),
    projectdesc: new Property(
        'Project Description',
        'string',
        (value: string) => {},
        (f: number, value: string) => {
            setProjectDescription(value)
        },
        () => {
            return projectDescription
        },
        () => {
            return highlightedPart === null
        },
    ),
    frames: new Property(
        '# of Frames',
        'number',
        (value: number) => {},
        (f: number, value: number) => {
            setFrameAmount(Math.floor(value))
        },
        () => {
            return frameAmount
        },
        () => {
            return highlightedPart === null
        },
    ),
}

export function getHighlightedProperties() {
    const showProperties = []

    for (const property in properties) {
        if (properties[property].enabled()) {
            showProperties.push(properties[property])
        }
    }

    return showProperties
}

export function updateKeyframeValues() {
    const showProperties = getHighlightedProperties()

    for (const property of showProperties) {
        if (property.type === 'number') {
            setPropertyNumber(property, property.get() as number)
        }
        if (property.type === 'string') {
            setPropertyString(property, property.get() as string)
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
        applyHelmet(part, data.skullowner as string)
    }
    if (data.block !== undefined) {
        applyBlock(part, data.block)
    }
}

export function initProperties(part: Object3D) {
    setHighlightedPart(part)

    for (const property in properties) {
        if (properties[property].enabled()) {
            if (properties[property].type === 'number') {
                properties[property].set(-1, properties[property].get() || 0)
            } else if (properties[property].type === 'string') {
                properties[property].set(-1, properties[property].get() || '')
            }
        }
    }

    for (const child of part.children) {
        if (child.name.split('|').length === 3) {
            initProperties(child)
        }
    }
}
