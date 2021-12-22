import _, { clamp, cloneDeep, floor, isEmpty } from 'lodash'
import { Vector2 } from 'three'
import { saveCommands } from './command_generator'
import {
    deselect,
    highlightedPart,
    raycaster,
    resetRotating,
    resetTranslating,
    rotating,
    select,
    setActualRotation,
    startControls,
    translating,
} from './controls'
import {
    deleteKeyframe,
    frame,
    frameAmount,
    frameData,
    frameNumber,
    loadFrameData,
    moveTimelineBar,
    nextFrame,
    prevFrame,
    setFrame,
    setFrameAmount,
    setFrameData,
    setRawFrameData,
    setTimelineBar,
    timelineBarRelease,
    tweenedFrameData,
    tweenFrames,
} from './frames'
import { BooleanObject, FrameData, Json, StringObject } from './interfaces'
import { wrap } from './maths'
import { loadModel, modelCount, models, setModelCount } from './model_loader'
import { height, renderer, width } from './render'
import {
    cubes,
    deleteAll,
    deleteEntity,
    playing,
    projectDescription,
    projectName,
    setPlaying,
    setProjectDescription,
    setProjectName,
} from './util'
import {
    dragFrameData,
    dragKeyframe,
    dragOverFrame,
    dragPath,
    dragProperty,
    keyframeDrag,
    releaseDragKeyframe,
    setDragOverFrame,
} from './timeline'
import { camera, cameraControls, camOrbit, lookAt } from './camera'
import { debugLog } from './debug'
import saveAs from 'file-saver'

export const mouse = new Vector2()
export const pMouse = new Vector2()
export let sensitivity = 0.007

export let camSpeed = 0.1

export let codes: BooleanObject = {}

export let isMouseDown = false
export let mouseButton = -1
export let isMouseDrag = false

export let searchPreview: string[] = []
export let searchSelection = 0
export const searchElement = document.getElementById('search')
export const searchInputElement = document.getElementById('search-input') as HTMLInputElement
let searchResults: HTMLUListElement = document.getElementById('search-results') as HTMLUListElement

searchInputElement.onblur = function () {
    searchResults.style.display = 'none'
    searchResults.innerHTML = ''
}

searchInputElement.onfocus = function () {
    updateSearch(searchInputElement.value)
}

export function allKeysUp() {
    codes = {}
}

export function setMouseDrag(mouseDrag: boolean) {
    isMouseDrag = mouseDrag
}

document.onmouseup = function (event) {
    event.preventDefault()

    timelineBarRelease()

    setMouseDown(false)
    resetRotating()
    resetTranslating()

    releaseDragKeyframe(clamp(floor((event.clientX - 8) / ((width - 16) / frameAmount) + 0.5), 0, frameAmount - 1))

    if (!isMouseDrag) {
        if (event.button === 0) leftClick()
        if (event.button === 2) rightClick()
    }
}

document.ondragover = function (event) {
    event.preventDefault()
}

document.ondrop = function (event) {
    event.preventDefault()
    if (event.dataTransfer.files.length > 0) {
        event.dataTransfer.files[0].text().then((text) => loadFromJSON(JSON.parse(text)))
    }
}

async function loadFromJSON(json: Json) {
    if (
        json.projectName === undefined ||
        json.projectDescription === undefined ||
        json.modelCount === undefined ||
        json.models === undefined ||
        json.frameAmount === undefined ||
        json.frameData === undefined
    ) {
        alert('Invalid JSON file')
        return
    }

    deleteAll()

    if (json.projectName !== undefined) {
        setProjectName(json.projectName as string)
    }

    if (json.projectDescription !== undefined) {
        setProjectDescription(json.projectDescription as string)
    }

    if (json.models !== undefined) {
        cubes.models = json.models as StringObject
        for (const [key, model] of Object.entries(cubes.models)) {
            await loadModel(model, key)
        }
    }

    if (json.modelCount !== undefined) {
        setModelCount(json.modelCount as number)
    }

    if (json.frameAmount !== undefined) {
        setFrameAmount(json.frameAmount as number)
    }

    if (json.frameData !== undefined) {
        setFrameData(json.frameData as FrameData)
    }

    setFrame(0)
}

export function leftClick() {
    const intersects = raycaster.intersectObjects(cubes.parts)

    if (intersects.length > 0) {
        select(intersects[0].object.parent)
    } else {
        deselect()
    }
}

export function rightClick() {}

export function setMouseDown(mouseDown: boolean) {
    isMouseDown = mouseDown
}

export function mouseDown(button: number) {
    isMouseDown = true
    mouseButton = button
    isMouseDrag = false
}

export function onSceneMouseDown(event: MouseEvent) {
    mouseDown(event.button)
    startControls()
}

export function onSearch(event: Event) {
    event.preventDefault()

    if (searchResults.children.length > 0) {
        loadModel(searchPreview[searchSelection])
    }
}

export function onSearchType(event: Event) {
    event.preventDefault()

    const pending = searchInputElement.value
    updateSearch(pending)
}

function addSearchResult(f: string, pending: string) {
    let filename = f.replace(/^.*[\\\/]/, '').slice(0, -8)

    if (filename.includes(pending)) {
        let number = searchResults.children.length
        let listElement = document.createElement('li')
        listElement.addEventListener('mouseover', () => setSearchSelection(number))
        listElement.addEventListener('mousedown', () => loadModel(searchPreview[searchSelection]))
        listElement.innerHTML = filename.replace(/_/g, ' ')
        searchResults.appendChild(listElement)
        searchPreview.push(f)
    }
}

function generateSearchResults(pending: string) {
    searchResults.innerHTML = ''

    for (let f of models) {
        const exactMatch = f.replace(/^.*[\\\/]/, '').slice(0, -8) === pending

        if (exactMatch && searchPreview.length !== 0) {
            let number = searchResults.children.length
            if (number < 5) {
                let listElement = document.createElement('li')
                listElement.addEventListener('mouseover', () => setSearchSelection(number))
                listElement.addEventListener('mousedown', () => loadModel(searchPreview[searchSelection]))

                searchResults.appendChild(listElement)
                searchPreview.push(searchPreview[0])
                searchPreview[0] = f

                const firstChild = searchResults.firstChild as HTMLElement

                const temp = firstChild.innerHTML

                firstChild.innerHTML = pending

                listElement.innerHTML = temp
            } else {
                ;(searchResults.firstChild as HTMLElement).innerHTML = pending
                searchPreview[0] = f
            }
        } else {
            if (searchResults.children.length < 5) {
                addSearchResult(f, pending)
            }
        }
    }
}

export function resetSearchSelection() {
    searchSelection = 0
}

export function setSearchSelection(value: number) {
    if (searchResults.children[searchSelection] !== undefined) {
        searchResults.children[searchSelection].classList.remove('hover-search')
    }

    searchSelection = wrap(value, 0, searchResults.children.length - 1)

    searchResults.children[searchSelection].classList.add('hover-search')
}

export function setSearchPreview(val: string[]) {
    searchPreview = val
}

export function updateSearch(pending: string) {
    pending = pending.endsWith(' ') ? pending.trim() + ' ' : pending.trim()

    pending = pending === ' ' ? '' : pending

    searchInputElement.value = pending

    pending = pending.toLowerCase().replace(/ /g, '_')

    setSearchPreview([])

    if (pending !== '') {
        generateSearchResults(pending)
    } else {
        searchResults.innerHTML = ''
    }

    if (searchResults.children.length > 0) {
        searchResults.style.display = 'inline-block'
        setSearchSelection(0)
    } else {
        searchResults.style.display = 'none'
    }
}

// NEXT copy/paste
document.addEventListener('keydown', onDocumentKeyDown)
export function onDocumentKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
        deselect()

        searchInputElement.blur()
        updateSearch('')
    }

    if (document.body === document.activeElement) {
        if (event.code === 'KeyX') {
            lookAt(camera, camOrbit)
        }
    }

    if (event.code === 'Delete') {
        if (codes.ControlLeft) {
            if (highlightedPart !== null) {
                deleteEntity(highlightedPart)
            }
        } else if (codes.ShiftLeft) {
            // NEXT deleting keyframes
            deleteKeyframe(frame, '')
        } else {
            if (highlightedPart !== null) {
                deleteKeyframe(frame, highlightedPart.name)
                setActualRotation()
            }
        }

        // updateAllKeyframes()
    }

    if (event.code === 'KeyS' && codes.ControlLeft) {
        event.preventDefault()

        saveAs(
            new Blob([
                JSON.stringify({
                    projectName: projectName,
                    projectDescription: projectDescription,
                    modelCount: modelCount,
                    models: cubes.models,
                    frameAmount: frameAmount,
                    frameData: frameData,
                }),
            ]),
            `${projectName}.aaproj`,
        )
    }
    if (event.code === 'KeyE' && codes.ControlLeft) {
        saveCommands()
    }

    if (event.code === 'ArrowDown') {
        setSearchSelection(searchSelection + 1)
    }
    if (event.code === 'ArrowUp') {
        setSearchSelection(searchSelection - 1)
    }

    if (document.activeElement.tagName !== 'INPUT') {
        if (event.code === 'ArrowRight') {
            nextFrame()
        }
        if (event.code === 'ArrowLeft') {
            prevFrame()
        }
    }

    if (event.code === 'Space' && codes.ControlLeft) {
        setPlaying(!playing)
    }
    if (event.code === 'Space' && codes.ShiftLeft) {
        searchInputElement.focus()
    }

    // TODO undo

    if (event.code === 'KeyD' && codes.ControlLeft) {
        event.preventDefault()
        debugLog()
    }

    codes[event.code] = true
}

document.addEventListener('keyup', onDocumentKeyUp, false)
function onDocumentKeyUp(event: KeyboardEvent) {
    codes[event.code] = false
}

export function onScroll(event: { deltaY: number }) {
    let camDist = camera.position.distanceTo(camOrbit)

    let direction = camera.position.clone()
    direction.sub(camOrbit)
    direction.divideScalar(camDist)
    camDist = Math.log2(camDist)

    camDist += event.deltaY / 500

    camDist = clamp(camDist, -2, 7)

    camDist = Math.pow(2, camDist)
    direction.multiplyScalar(camDist)
    direction.add(camOrbit)
    camera.position.set(direction.x, direction.y, direction.z)
}

let hidden: string, visibilityChange
type BetterDocument = Document & { msHidden: string; webkitHidden: string }
if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
} else if (typeof (document as BetterDocument).msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
} else if (typeof (document as BetterDocument).webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
}
document.addEventListener(visibilityChange, handleVisibilityChange, false)
window.addEventListener('blur', handleVisibilityChange, false)
function handleVisibilityChange() {
    for (const [key, value] of Object.entries(codes)) {
        codes[key] = false
    }
}

export function timelineMove(event: MouseEvent) {
    event.preventDefault()

    const f = clamp(floor((event.clientX - 8) / ((width - 16) / frameAmount) + 0.5), 0, frameAmount - 1)

    setFrame(f)

    let head = document.getElementById('timeline-bar-head')
    let bar = document.getElementById('timeline-bar')

    head.style.left = clamp(event.x - 8, 0, width - 16) + 'px'
    bar.style.left = clamp(event.x - 8, 0, width - 16) + 'px'
}

document.addEventListener('mousemove', onMouseMove)
export function onMouseMove(event: MouseEvent) {
    mouse.x = (event.clientX / width) * 2 - 1
    mouse.y = -(event.clientY / height) * 2 + 1

    // proportional mouse
    pMouse.x = (event.clientX / height) * 2 - 1
    pMouse.y = -(event.clientY / height) * 2 + 1

    if (dragKeyframe !== null) {
        keyframeDrag(event)
    } else if (moveTimelineBar) {
        timelineMove(event)
    } else {
        if (isMouseDown && rotating === '' && translating === '') {
            cameraControls(event.movementX, event.movementY)
        }
    }

    setMouseDrag(true)
}

export function initInput() {
    renderer.domElement.addEventListener('wheel', onScroll)

    for (let element of document.getElementsByClassName('timeline-bar')) {
        element.addEventListener('mousedown', (event: Event) => event.preventDefault())
    }
}
