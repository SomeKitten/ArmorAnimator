// TODO keyframes for data tags

import { cloneDeep, floor, toNumber } from 'lodash'
import { highlightedPart } from './controls'
import {
    frame,
    frameAmount,
    frameData,
    frameSpacing,
    frameY,
    loadFrameData,
    loadPartFrameData,
    partFrameData,
    tweenedFrameData,
    tweenFrames,
} from './frames'
import { Frame, FrameData } from './interfaces'
import { width } from './render'

export const keyframeListeners: ((object: MouseEvent) => void)[] = []

// TODO generalize this to support many timelines
export let keyframes: HTMLImageElement[] = []
export let partKeyframes: HTMLImageElement[] = []

export let dragKeyframes: HTMLImageElement[] | null = null
export let dragKeyframeData: Frame | null = null
export let dragKeyframeName: string = ''
export let moveFrameData: FrameData | null = null
export let dragKeyframeFrame: number = -1
export let dragKeyframeTimeline: number = -1

export function updateAllKeyframes() {
    loadPartFrameData()

    updateKeyframes(frameData, frameY)
    updateKeyframes(partFrameData, frameY + frameSpacing)
}

// FIXME all keyframes on part timeline disappear when dragging
// NEXT rewrite this to reuse keyframes instead of constantly generating new ones
export function updateKeyframes(data: FrameData, y: number) {
    let timeline = document.getElementById('timeline')

    if (y === frameY) {
        keyframes = []
    } else {
        partKeyframes = []
    }

    let dataKeys = document.getElementsByClassName('keyframe_' + y)
    while (dataKeys[0]) {
        dataKeys[0].parentElement.removeChild(dataKeys[0])
    }
    if (dragKeyframes !== null) {
        timeline.appendChild(dragKeyframes[0])
        if (dragKeyframes[1] !== undefined) {
            timeline.appendChild(dragKeyframes[1])
        }
    }

    for (let f = 0; f < frameAmount; f++) {
        const entries = Object.entries(data[f]).length
        if (entries > 0 || (moveFrameData !== null && Object.entries(moveFrameData[f]).length > 0 && y === frameY)) {
            if (moveFrameData === null || (Object.entries(moveFrameData[f]).length > 0 && y === frameY)) {
                let highlightedName = ''
                if (y !== frameY) {
                    highlightedName = highlightedPart.name
                }
                keyframeListeners[f] = function (event: MouseEvent) {
                    setDragKeyframe(keyframe, data, highlightedName, f)
                }

                let keyframe = document.createElement('img')
                keyframe.classList.add('keyframe')
                keyframe.classList.add('keyframe_' + y)
                keyframe.src = 'images/diamond.png'
                keyframe.addEventListener('mousedown', keyframeListeners[f])

                keyframe.style.left = (f / frameAmount) * (width - 16) + 'px'
                keyframe.style.top = y + 'px'

                if (y === frameY) {
                    keyframes[f] = keyframe
                } else {
                    partKeyframes[f] = keyframe
                }
                timeline.appendChild(keyframe)
            }
        }
    }
}

export function dragKeyframeTo(data: FrameData, f: number) {
    for (let i = 0; i < frameAmount; i++) {
        data[i] = cloneDeep(moveFrameData[i])
    }

    dragKeyframes[0].removeEventListener('mousedown', keyframeListeners[dragKeyframeFrame])
    const localDragKeyframe0 = dragKeyframes[0]
    // FIXME remove duplicates or just rewrite the entire damn thing
    keyframeListeners[f] = function (event: MouseEvent) {
        setDragKeyframe(localDragKeyframe0, data, dragKeyframeName, f)
    }
    dragKeyframes[0].addEventListener('mousedown', keyframeListeners[f])

    if (dragKeyframes[1] !== undefined) {
        const localDragKeyframe1 = dragKeyframes[1]
        keyframeListeners[f] = function (event: MouseEvent) {
            setDragKeyframe(localDragKeyframe1, data, dragKeyframeName, f)
        }
        dragKeyframes[1].addEventListener('mousedown', keyframeListeners[f])
    }

    for (const framePartName of Object.keys(dragKeyframeData)) {
        const framePart = dragKeyframeData[framePartName]

        if (data[f][framePartName] === undefined) {
            data[f][framePartName] = {}
        }

        for (const property of Object.keys(framePart)) {
            data[f][framePartName][property] = dragKeyframeData[framePartName][property]
        }
    }

    loadPartFrameData()

    setDragKeyframeFrame(f)

    tweenFrames()
    loadFrameData(tweenedFrameData[frame])

    updateAllKeyframes()
}

export function deleteKeyframe(f: number, name: string) {
    for (const [key] of Object.entries(frameData[frame])) {
        if (key.includes(name)) {
            delete frameData[f][key]
            delete partFrameData[f][key]
        }
    }

    tweenFrames()
    loadFrameData(tweenedFrameData[frame])
}

export function setDragKeyframeFrame(f: number) {
    dragKeyframeFrame = f
}

export function setDragKeyframe(keyframe: HTMLImageElement, data: FrameData, name: string, f: number) {
    dragKeyframes = [keyframes[f], partKeyframes[f]]
    dragKeyframeData = {}
    moveFrameData = cloneDeep(frameData)
    dragKeyframeFrame = f
    dragKeyframeName = name
    dragKeyframeTimeline = toNumber(keyframe.style.top.slice(0, -2))

    if (data[f][name] !== undefined) {
        dragKeyframeData[name] = data[f][name]
        for (const property of Object.keys(dragKeyframeData[name])) {
            delete moveFrameData[f][name][property]
        }
        delete moveFrameData[f][name]
    } else {
        dragKeyframeData = cloneDeep(data[f])
        moveFrameData[f] = {}
    }
}

export function resetDragKeyframe() {
    if (dragKeyframes !== null) {
        const left = (toNumber(dragKeyframes[0].style.left.slice(0, -2)) - 8) / ((width - 16) / frameAmount) + 0.5

        dragKeyframes[0].style.left = (floor(left) * ((width - 16) / frameAmount)).toString() + 'px'

        // FIXME seriously, remove all of these lmao
        if (dragKeyframes[1] !== undefined) {
            dragKeyframes[1].style.left = (floor(left) * ((width - 16) / frameAmount)).toString() + 'px'
        }

        dragKeyframes = null
        dragKeyframeData = null
        moveFrameData = null
        dragKeyframeFrame = -1
        dragKeyframeName = ''

        updateAllKeyframes()
    }
}
