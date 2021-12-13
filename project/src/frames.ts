// TODO make seperate timelines for different kinds of movement (x translation, y translation, x rotation, y rotation etc.)

import { clamp, cloneDeep, floor, isEqual, round } from 'lodash'
import { Object3D } from 'three'
import { highlightedPart } from './controls'
import { Frame, FrameData } from './interfaces'
import { wrap } from './maths'
import { width } from './render'
import { scene } from './util'
import { updateAllKeyframes } from './keyframes'
import { loadKeyframeValues, updateKeyframeValues } from './properties'

export let frameData: FrameData = {}
export let partFrameData: FrameData = {}
export let tweenedFrameData: FrameData = {}
export let commandFrameData: FrameData = {}
export let cleanFrames: FrameData = {}
export let frame = 0
export let frameAmount = 0
export let fps = 20

export let frameNumber = document.getElementById('frame-number')

export let moveTimelineBar = false

export let frameY = 0
export let frameSpacing = 100

// TODO put timeline in variable
// TODO hide timeline when frameAmount is 1

export function setFrameAmount(value: number) {
    frameAmount = round(value) > 0 ? round(value) : 1

    for (let f = -1; f < frameAmount; f++) {
        if (frameData[f] === undefined) {
            cleanFrames[f] = {}
            frameData[f] = {}
            partFrameData[f] = {}
            tweenedFrameData[f] = {}
            commandFrameData[f] = {}
        }
    }

    updateAllKeyframes()
    setFrame(Math.min(frame, frameAmount - 1))
}

export function resetFrameData() {
    frameData = cloneDeep(cleanFrames)
}

export function setFrameData(newData: FrameData) {
    frameData = newData

    tweenFrames()
    updateAllKeyframes()
}

export function resetPartFrameData() {
    partFrameData = cloneDeep(cleanFrames)
}

export function timelineSelectBar(event: MouseEvent) {
    moveTimelineBar = true

    const clickFrame = clamp(floor((event.clientX - 8) / ((width - 16) / frameAmount) + 0.5), 0, frameAmount - 1)
    setFrame(clickFrame)
}

export function timelineBarRelease() {
    moveTimelineBar = false
    setTimelineBar(frame)
}

export function setTimelineBar(frame: number) {
    let head = document.getElementById('timeline-bar-head')
    let bar = document.getElementById('timeline-bar')
    let x = frame * ((width - 16) / frameAmount)
    head.style.left = x + 'px'
    bar.style.left = x + 'px'
}

export function findNextPropertyFrame(frame: number, partName: string, propertyName: string) {
    for (let f = frame + 1; f < frameAmount; f++) {
        if (frameData[f][partName] !== undefined && frameData[f][partName][propertyName] !== undefined) {
            return f
        }
    }

    return frameAmount
}

export function tween(propertyStart: number[] | string, propertyEnd: number[] | string, amount: number) {
    if (typeof propertyStart === 'string' && typeof propertyEnd === 'string') {
        return propertyStart
    } else if (typeof propertyStart[0] === 'number' && typeof propertyEnd[0] === 'number') {
        propertyStart = propertyStart as number[]
        propertyEnd = propertyEnd as number[]
        let distance = [
            (propertyEnd[0] - propertyStart[0]) * amount,
            (propertyEnd[1] - propertyStart[1]) * amount,
            (propertyEnd[2] - propertyStart[2]) * amount,
        ]

        return [propertyStart[0] + distance[0], propertyStart[1] + distance[1], propertyStart[2] + distance[2]]
    }
}

export function tweenProperty(frame: number, partName: string, propertyName: string) {
    let nextFrame = findNextPropertyFrame(frame, partName, propertyName)
    let currentData = frameData[frame][partName][propertyName]
    let nextData = null
    if (nextFrame !== frameAmount) {
        nextData = frameData[nextFrame][partName][propertyName]
    } else {
        nextData = currentData
    }

    for (let f = frame; f < nextFrame; f++) {
        if (tweenedFrameData[f][partName] === undefined) {
            tweenedFrameData[f][partName] = {}
        }
        tweenedFrameData[f][partName][propertyName] = tween(currentData, nextData, (f - frame) / (nextFrame - frame))

        if (
            tweenedFrameData[f - 1] === undefined ||
            !isEqual(tweenedFrameData[f][partName][propertyName], tweenedFrameData[f - 1][partName][propertyName]) ||
            f === 0
        ) {
            if (commandFrameData[f][partName] === undefined) {
                commandFrameData[f][partName] = {}
            }
            commandFrameData[f][partName][propertyName] = cloneDeep(tweenedFrameData[f][partName][propertyName])
        }
    }

    if (nextFrame !== frameAmount) {
        tweenProperty(nextFrame, partName, propertyName)
    }
}

export function tweenFrames() {
    tweenedFrameData = cloneDeep(cleanFrames)
    commandFrameData = cloneDeep(cleanFrames)
    tweenedFrameData[-1] = cloneDeep(frameData[-1])

    for (const [partName, part] of Object.entries(frameData[-1])) {
        for (const [propertyName, property] of Object.entries(part)) {
            tweenProperty(-1, partName, propertyName)
        }
    }
}

export function deleteFramesByName(name: string) {
    for (const [key] of Object.entries(frameData[-1])) {
        if (key.includes(name)) {
            for (let f = -1; f < frameAmount; f++) {
                delete frameData[f][key]
            }
        }
    }
}

export function loadFrameData(thisFrame: Frame) {
    for (const [key, value] of Object.entries(thisFrame)) {
        let part = scene.getObjectByName(key)

        loadKeyframeValues(part, value)
    }

    if (highlightedPart !== null) {
        updateKeyframeValues()
    }
}

export function setFrame(f: number) {
    frame = clamp(f, 0, frameAmount - 1)

    tweenFrames()

    let thisFrame = tweenedFrameData[frame]

    loadFrameData(thisFrame)

    frameNumber.innerHTML = frame.toString()

    setTimelineBar(f)
}

export function prevFrame() {
    setFrame(wrap(frame - 1, 0, frameAmount - 1))
}

export function nextFrame() {
    setFrame(wrap(frame + 1, 0, frameAmount - 1))
}

export function loadPartFrameData() {
    resetPartFrameData()
    if (highlightedPart !== null) {
        for (let f = 0; f < frameAmount; f++) {
            for (const part of Object.keys(frameData[f])) {
                if (part === highlightedPart.name) {
                    partFrameData[f][part] = cloneDeep(frameData[f][part])
                }
            }
        }
    }
}

export function saveTranslation(f: number, part: Object3D, translation: number[]) {
    if (frameData[f][part.name] === undefined) {
        frameData[f][part.name] = {}
    }

    let framePart = frameData[f][part.name]
    if (framePart.translation === undefined) {
        framePart.translation = []
    }

    framePart.translation[0] = translation[0]
    framePart.translation[1] = translation[1]
    framePart.translation[2] = translation[2]

    if (part === highlightedPart) {
        if (partFrameData[f][part.name] === undefined) {
            partFrameData[f][part.name] = {}
        }

        let partFramePart = partFrameData[f][part.name]
        if (partFramePart.translation === undefined) {
            partFramePart.translation = []
        }

        partFramePart.translation[0] = translation[0]
        partFramePart.translation[1] = translation[1]
        partFramePart.translation[2] = translation[2]
    }

    updateAllKeyframes()
}

export function saveRotation(f: number, part: Object3D, rotation: number[]) {
    if (frameData[f][part.name] === undefined) {
        frameData[f][part.name] = {}
    }

    let framePart = frameData[f][part.name]
    if (framePart.rotation === undefined) {
        framePart.rotation = []
    }

    framePart.rotation[0] = rotation[0]
    framePart.rotation[1] = rotation[1]
    framePart.rotation[2] = rotation[2]

    if (part === highlightedPart) {
        if (partFrameData[f][part.name] === undefined) {
            partFrameData[f][part.name] = {}
        }

        let partFramePart = partFrameData[f][part.name]
        if (partFramePart.rotation === undefined) {
            partFramePart.rotation = []
        }

        partFramePart.rotation[0] = rotation[0]
        partFramePart.rotation[1] = rotation[1]
        partFramePart.rotation[2] = rotation[2]
    }

    updateAllKeyframes()
}

export function saveHelmet(f: number, part: Object3D, skullOwner: string) {
    if (frameData[f][part.name] === undefined) {
        frameData[f][part.name] = {}
    }

    let framePart = frameData[f][part.name]
    if (framePart.skullowner === undefined) {
        framePart.skullowner = ''
    }

    framePart.skullowner = skullOwner

    if (part === highlightedPart) {
        if (partFrameData[f][part.name] === undefined) {
            partFrameData[f][part.name] = {}
        }

        let partFramePart = partFrameData[f][part.name]
        if (partFramePart.skullowner === undefined) {
            partFramePart.skullowner = ''
        }

        partFramePart.skullowner = skullOwner
    }

    updateAllKeyframes()
}

export function saveNBT(f: number, part: Object3D, nbt: string) {
    if (frameData[f][part.name] === undefined) {
        frameData[f][part.name] = {}
    }

    let framePart = frameData[f][part.name]

    framePart.nbt = nbt

    if (part === highlightedPart) {
        if (partFrameData[f][part.name] === undefined) {
            partFrameData[f][part.name] = {}
        }

        let partFramePart = partFrameData[f][part.name]

        partFramePart.nbt = nbt
    }

    updateAllKeyframes()
}

export function saveBlock(f: number, part: Object3D, block: string) {
    if (frameData[f][part.name] === undefined) {
        frameData[f][part.name] = {}
    }

    let framePart = frameData[f][part.name]

    framePart.block = block

    if (part === highlightedPart) {
        if (partFrameData[f][part.name] === undefined) {
            partFrameData[f][part.name] = {}
        }

        let partFramePart = partFrameData[f][part.name]

        partFramePart.block = block
    }

    updateAllKeyframes()
}
