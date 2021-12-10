import { Vector3, Quaternion, Spherical, Frustum, Object3D, Scene, Color, Clock } from 'three'
import { headCache } from './armor'
import { updateCamOrbit } from './camera'
import { deselect, resetHighlightedPart } from './controls'
import {
    deleteFramesByName,
    frame,
    frameData,
    loadFrameData,
    resetFrameData,
    tweenedFrameData,
    tweenFrames,
} from './frames'
import { Cubes, CubesObject, Settings } from './interfaces'
import { deletePropertyInputs } from './menu'

export const target = new Vector3()
export const targetQ = new Quaternion()
export const targetS = new Spherical()
export const targetF = new Frustum()

export const settings: Settings = {}
// const setting = fs.readFileSync(path.resolve(__dirname, 'res', 'settings', 'general.json'))
// const setting = fs.readFileSync('./settings/general.json')
// settings.general = JSON.parse(setting.toString())
// settings.general = JSON.parse('{}')
fetch('/settings/general.json')
    .then((res) => res.json())
    .then((res) => {
        settings.general = res
    })

export const scene = new Scene()
scene.background = new Color(0x008888)

export let cubes: Cubes = {
    parts: [] as Object3D[],
    models: {},
}

export let playing = false
export let lastFrame = 0
export let clock = new Clock()

// FIXME figure out which mobs can wear heads and implement code for them
export const canWearArmor = {
    armor_stand: true,
    drowned: true,
    giant: true,
    husk: true,
    piglin: true,
    piglin_brute: true,
    skeleton: true,
    stray: true,
    wither_skeleton: true,
    zombie: true,
    zombie_villager: true,
    zombified_piglin: true,
}

export let projectDescription = 'An animation created with ArmorAnimator'
export let projectName = 'MyProject'

export function setProjectName(value: string) {
    projectName = value
}

export function setProjectDescription(value: string) {
    projectDescription = value
}

export function getCubesObject(root: CubesObject, name: string): CubesObject | null {
    for (const [key, value] of Object.entries(root.children)) {
        if (key === name) {
            return value
        }

        const obj = getCubesObject(value, name)
        if (obj !== null) {
            return obj
        }
    }

    return null
}

export function resetCubes() {
    cubes = {
        parts: [] as Object3D[],
        models: {},
    }
}

export async function getAllModels() {
    return await (await fetch('/models/model_list.json')).json()
}

export function getChild(obj: Object) {
    return obj[Object.entries(obj)[0][0]]
}

export function setPlaying(val: boolean) {
    playing = val
}

export function setLastFrame(val: number) {
    lastFrame = val
}

export function deleteObject(obj: Object3D) {
    scene.remove(obj)
    delete cubes[obj.name]
    for (let part = 0; part < cubes.parts.length; ) {
        let partName = cubes.parts[part].name
        if (partName.includes(obj.name)) {
            cubes.parts.splice(part, 1)
        } else {
            part++
        }
    }

    deleteFramesByName(obj.name)
}

export function getRootObject(obj: Object3D) {
    let nameParts = obj.name.split('|')
    let name = nameParts[0] + '|' + nameParts[1]

    return scene.getObjectByName(name)
}

export function deleteObjectRoot(obj: Object3D) {
    deleteObject(getRootObject(obj))
}

export function notNull(obj: Object | null) {
    if (obj === null) {
        return console.error('Object is null.')
    }

    return obj
}

export function deleteAll() {
    resetCubes()
    resetFrameData()

    const toDelete = []
    for (const obj of scene.children) {
        // ! only objects part of the animation should have | in their names
        if (obj.name.includes('|')) {
            toDelete.push(obj)
        }
    }

    for (const obj of toDelete) {
        obj.removeFromParent()
    }
}

// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
/**
 * @param {String} HTML representing a single element
 * @return {Element} html element
 */
export function htmlToElement(html: string): Element {
    var template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    return template.content.firstChild as Element
}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList}
 */
export function htmlToElements(html: string): NodeList {
    var template = document.createElement('template')
    template.innerHTML = html
    return template.content.childNodes
}

export function flipSign(num: string | number) {
    num = num.toString()
    if (num.startsWith('-')) {
        return num.slice(1, -1)
    } else {
        return '-' + num.slice(0, -1)
    }
}

export function deleteEntity(part: Object3D) {
    deselect()

    const root = getRootObject(part)

    updateCamOrbit(root)

    delete cubes.models[root.name]
    deleteObject(root)

    tweenFrames()
    loadFrameData(frameData[frame])

    resetHighlightedPart()

    deletePropertyInputs()
}

// TODO add simple math to direct mode
// ? you can run a number through here to get rid of scientific notation and set it to 0
export function cleanNumber(num: string | number, truncate: number) {
    num = num.toString()
    // RegEx to single out only numbers
    if (/^[\+\-]?\d*\.?\d*\-?$/.test(num)) {
        while (/^0[^\.]/gm.test(num)) {
            num = num.slice(1)
        }
        if (truncate !== -1) {
            while (/\.\d{6,}$/.test(num) || /\.\d*0$/.test(num)) {
                num = num.slice(0, -1)
            }
        }

        if (num === '') {
            return '0'
        }
        if (num === '.') {
            return '0.'
        }

        num = num.startsWith('+') ? num.slice(1) : num // remove + sign from start

        if (/-$/.test(num)) {
            num = flipSign(num)
        }

        return num
    } else {
        // RegEx to see if it is still a number, but not one I want to deal with...
        if (/^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?$/gm.test(num)) {
            return '0'
        }
        return false
    }
}

export function getHeadProperty(part: Object3D) {
    if (
        tweenedFrameData[frame][part.name] !== undefined &&
        tweenedFrameData[frame][part.name].skullowner !== undefined
    ) {
        return tweenedFrameData[frame][part.name].skullowner
    } else {
        return ''
    }
}

export function getNBTProperty(part: Object3D) {
    if (tweenedFrameData[frame][part.name] !== undefined && tweenedFrameData[frame][part.name].nbt !== undefined) {
        return tweenedFrameData[frame][part.name].nbt
    } else {
        return ''
    }
}

// https://scotch.io/tutorials/understanding-memoization-in-javascript
export function memoizer(fun: Function) {
    return function (n: any) {
        if (headCache[n] != undefined) {
            return headCache[n]
        } else {
            let result = fun(n)
            headCache[n] = result
            return result
        }
    }
}
