import { clamp, cloneDeep, floor } from 'lodash'
import { Object3D } from 'three'
import { highlightedPart } from './controls'
import { frame, frameAmount, frameData, loadFrameData, setRawFrameData, tweenedFrameData, tweenFrames } from './frames'
import { BooleanObject, FrameData, Tags } from './interfaces'
import { height, timelineHeight, width } from './render'

const timeline = document.getElementById('timeline')
const timelineLabelDiv = document.getElementById('timeline-label-div')
export const timelineLabels = [...document.getElementsByClassName('timeline-label')]

timeline.addEventListener('mouseenter', (event: MouseEvent) => {
    timelineLabelDiv.style.opacity = '30%'
    timelineLabelDiv.style.zIndex = '0'
})
timeline.addEventListener('mouseleave', (event: MouseEvent) => {
    timelineLabelDiv.style.opacity = '100%'
    timelineLabelDiv.style.zIndex = '5'
})

export const timelines: { [key: string]: HTMLImageElement[] } = {}

export const timelineCanvas = document.getElementById('timeline-canvas') as HTMLCanvasElement
export const timelineContext = timelineCanvas.getContext('2d')

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

const timelineNames = {
    rotation: 'Rotation',
    translation: 'Translation',
    nbt: 'NBT',
    block: 'Block',
    skullowner: 'Skull Owner',
}

export function updateAllKeyframes() {
    timelineLabels.forEach((label: Element) => {
        label.textContent = ''
    })

    if (highlightedPart !== null) {
        updatePart(highlightedPart)

        let i = 0
        for (const t in timelines) {
            timelines[t].forEach((keyframe: HTMLImageElement, k: number) => {
                keyframe.style.top = `${
                    ((i + 0.5) * (timelineHeight * window.innerHeight)) / timelineLabels.length - 8
                }px`
            })

            timelineLabels[i].textContent = timelineNames[t]
            i++
        }
    }
}

function updatePart(part: Object3D) {
    const keep: BooleanObject = {}

    for (const propertyName in frameData[-1][part.name]) {
        keep[propertyName] = true

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

                if (!timelines[propertyName]) {
                    delete timelines[propertyName]
                }
            }
        }
    }

    for (const propertyName in timelines) {
        if (!keep[propertyName]) {
            timelines[propertyName].forEach((keyframe: HTMLImageElement, k: number) => {
                keyframe.removeEventListener('mousedown', dragListeners[`${part.name}-${propertyName}-${k}`])
                timeline.removeChild(keyframe)
            })

            delete timelines[propertyName]
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

export function keyframeDrag(event: MouseEvent) {
    dragKeyframe.style.left = clamp(event.clientX - 8, 0, width - 16) + 'px'

    const f = clamp(floor((event.clientX - 8) / ((width - 16) / frameAmount) + 0.5), 0, frameAmount - 1)

    setRawFrameData(cloneDeep(dragFrameData))

    if (frameData[f][dragPath.part] === undefined) {
        frameData[f][dragPath.part] = {}
    }
    frameData[f][dragPath.part][dragPath.property] = dragProperty

    tweenFrames()
    loadFrameData(tweenedFrameData[frame])

    setDragOverFrame(f)
}
