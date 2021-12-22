import { cloneDeep } from 'lodash'
import { Object3D } from 'three'
import { highlightedPart } from './controls'
import { frameAmount, frameData } from './frames'
import { FrameData, Tags } from './interfaces'
import { height, timelineHeight, width } from './render'

const timeline = document.getElementById('timeline')
// TODO replace this any with a proper type
const timelines: { [key: string]: HTMLImageElement[] } = {}

export let dragKeyframe: HTMLImageElement | null = null
export let dragFrameData: FrameData = {}
export let dragProperty: Tags
export const dragPath = {
    frame: 0,
    part: '',
    property: '',
}

export const dragListeners: { [key: string]: (event: MouseEvent) => void } = {}

export let dragOverFrame = 0

export function updateAllKeyframes() {
    if (highlightedPart !== null) {
        updatePart(highlightedPart)

        let i = 0
        for (const t in timelines) {
            timelines[t].forEach((keyframe: HTMLImageElement, k: number) => {
                keyframe.style.top = `${(i * (timelineHeight * window.innerHeight - 16)) / 8}px`
            })
            i++
        }
    }
}

function updatePart(part: Object3D) {
    for (const propertyName in frameData[-1][part.name]) {
        timelines[propertyName] = timelines[propertyName] || []

        for (let f = 0; f < frameAmount; f++) {
            if (frameData[f][part.name] !== undefined && frameData[f][part.name][propertyName] !== undefined) {
                if (timelines[propertyName][f] === undefined) {
                    const timelineKey = `${part.name}-${propertyName}`
                    const key = `${timelineKey}-${f}`

                    timelines[propertyName][f] = document.createElement('img') as HTMLImageElement
                    timelines[propertyName][f].className = 'keyframe'
                    timelines[propertyName][f].src = './images/diamond.png'
                    timelines[propertyName][f].style.left = `${(f * (width - 16)) / frameAmount}px`

                    dragListeners[key] = (event: MouseEvent) => {
                        event.preventDefault()

                        dragKeyframe = timelines[propertyName][f]
                        dragFrameData = cloneDeep(frameData)
                        dragPath.frame = f
                        dragPath.part = part.name
                        dragPath.property = propertyName
                        dragProperty = cloneDeep(frameData[f][part.name][propertyName])

                        delete dragFrameData[f][part.name][propertyName]

                        dragOverFrame = f
                    }

                    timelines[propertyName][f].addEventListener('mousedown', dragListeners[key])

                    timeline.appendChild(timelines[propertyName][f])
                }
            } else if (timelines[propertyName][f] !== undefined) {
                timelines[propertyName][f].removeEventListener(
                    'mousedown',
                    dragListeners[`${part.name}-${propertyName}-${f}`],
                )
                timeline.removeChild(timelines[propertyName][f])
                delete timelines[propertyName][f]
            }
        }
    }
}

export function releaseDragKeyframe(f: number) {
    if (dragKeyframe !== null) {
        const oldKey = `${dragPath.part}-${dragPath.property}-${dragPath.frame}`
        const key = `${dragPath.part}-${dragPath.property}-${f}`

        dragKeyframe.style.left = `${f * ((width - 16) / frameAmount)}px`

        delete timelines[dragPath.property][dragPath.frame]
        if (timelines[dragPath.property][f] !== undefined) {
            timelines[dragPath.property][f].removeEventListener('mousedown', dragListeners[key])
            timeline.removeChild(timelines[dragPath.property][f])
        }
        timelines[dragPath.property][f] = dragKeyframe

        dragKeyframe.removeEventListener('mousedown', dragListeners[oldKey])

        const part = dragPath.part
        const property = dragPath.property

        // TODO remove redundancy on event declaration
        dragListeners[key] = (event: MouseEvent) => {
            event.preventDefault()

            dragKeyframe = timelines[property][f]
            dragFrameData = cloneDeep(frameData)
            dragPath.frame = f
            dragPath.part = part
            dragPath.property = property
            dragProperty = cloneDeep(frameData[f][part][property])

            delete dragFrameData[f][part][property]

            dragOverFrame = f
        }

        dragKeyframe.addEventListener('mousedown', dragListeners[`${dragPath.part}-${dragPath.property}-${f}`])

        dragKeyframe = null
    }
}

export function setDragOverFrame(f: number) {
    dragOverFrame = f
}
