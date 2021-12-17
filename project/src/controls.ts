import {
    Vector2,
    Vector3,
    Raycaster,
    Object3D,
    Matrix4,
    CircleGeometry,
    Mesh,
    MeshBasicMaterial,
    CompressedPixelFormat,
} from 'three'
import { frame, resetPartFrameData, saveRotation, saveTranslation, tweenedFrameData, tweenFrames } from './frames'
import { getAngle } from './maths'
import { codes, mouse, pMouse, searchInputElement } from './input'
import {
    updatePasses,
    selectedOutlinePassLine,
    composer,
    xRotateOutline,
    yRotateOutline,
    zRotateOutline,
    xTranslateOutline,
    yTranslateOutline,
    zTranslateOutline,
    xAxisCircle,
    xAxisClick,
    xAxisInner,
    xAxisLine,
    xAxisOuter,
    yAxisCircle,
    yAxisClick,
    yAxisInner,
    yAxisLine,
    yAxisOuter,
    zAxisCircle,
    zAxisClick,
    zAxisInner,
    zAxisLine,
    zAxisOuter,
    grid,
    point3D,
    height,
    width,
} from './render'
import { getRootObject, scene, target, targetQ } from './util'
import _, { floor, round } from 'lodash'
import { createPropertyInputs, deletePropertyInputs, propertyInputDiv } from './menu'
import { updateAllKeyframes } from './keyframes'
import { getHighlightedProperties, properties, updateKeyframeValues } from './properties'
import { camera, camOrbit } from './camera'
import { loadSettings, setSettingsPart } from './settings'
import { headSize } from './player_head'

export const raycaster = new Raycaster()

export let snapDistance = 0.25

export let snapAngle = Math.PI / 4

export let actualHighlightedRotation = [0, 0, 0]

export let rotating = ''
export let translating = ''

export let movementOrigin = 0
export let movementAngle = 0
export const originalCoords = new Vector3()

export let highlightedPart: Object3D = null

export function setHighlightedPart(part: Object3D) {
    highlightedPart = part
    setSettingsPart(part.name)
}

export function resetRotating() {
    rotating = ''
}

export function resetTranslating() {
    translating = ''
}

export function resetControls() {
    composer.removePass(xRotateOutline)
    composer.removePass(yRotateOutline)
    composer.removePass(zRotateOutline)

    composer.removePass(xTranslateOutline)
    composer.removePass(yTranslateOutline)
    composer.removePass(zTranslateOutline)
}

export function setActualRotation() {
    tweenFrames()

    let rot = tweenedFrameData[frame][highlightedPart.name].rotation

    actualHighlightedRotation = [rot[0], rot[1], rot[2]]
}

export function resetActualRotation() {
    actualHighlightedRotation = [0, 0, 0]
}

export function updateControls() {
    scene.updateMatrixWorld()
    highlightedPart.getWorldPosition(target)
    let controlScale = camera.position.distanceTo(target) / 3

    updatePasses()

    xAxisCircle.removeFromParent()
    xAxisOuter.removeFromParent()
    xAxisInner.removeFromParent()
    yAxisCircle.removeFromParent()
    yAxisOuter.removeFromParent()
    yAxisInner.removeFromParent()
    zAxisCircle.removeFromParent()
    zAxisOuter.removeFromParent()
    zAxisInner.removeFromParent()
    xAxisLine.removeFromParent()
    yAxisLine.removeFromParent()
    zAxisLine.removeFromParent()
    xAxisClick.removeFromParent()
    yAxisClick.removeFromParent()
    zAxisClick.removeFromParent()
    xAxisCircle.position.set(target.x, target.y, target.z)
    xAxisOuter.position.set(target.x, target.y, target.z)
    xAxisInner.position.set(target.x, target.y, target.z)
    yAxisCircle.position.set(target.x, target.y, target.z)
    yAxisOuter.position.set(target.x, target.y, target.z)
    yAxisInner.position.set(target.x, target.y, target.z)
    zAxisCircle.position.set(target.x, target.y, target.z)
    zAxisOuter.position.set(target.x, target.y, target.z)
    zAxisInner.position.set(target.x, target.y, target.z)
    xAxisLine.position.set(target.x, target.y, target.z)
    yAxisLine.position.set(target.x, target.y, target.z)
    zAxisLine.position.set(target.x, target.y, target.z)
    xAxisClick.position.set(target.x, target.y, target.z)
    yAxisClick.position.set(target.x, target.y, target.z)
    zAxisClick.position.set(target.x, target.y, target.z)
    xAxisCircle.scale.setScalar(controlScale)
    xAxisOuter.scale.setScalar(controlScale * 1.1)
    xAxisInner.scale.setScalar(controlScale * 0.9)
    yAxisCircle.scale.setScalar(controlScale)
    yAxisOuter.scale.setScalar(controlScale * 1.1)
    yAxisInner.scale.setScalar(controlScale * 0.9)
    zAxisCircle.scale.setScalar(controlScale)
    zAxisOuter.scale.setScalar(controlScale * 1.1)
    zAxisInner.scale.setScalar(controlScale * 0.9)
    xAxisLine.scale.setScalar(controlScale)
    yAxisLine.scale.setScalar(controlScale)
    zAxisLine.scale.setScalar(controlScale)
    xAxisClick.scale.setScalar(controlScale)
    yAxisClick.scale.setScalar(controlScale)
    zAxisClick.scale.setScalar(controlScale)
    highlightedPart.parent.attach(xAxisCircle)
    highlightedPart.parent.attach(xAxisOuter)
    highlightedPart.parent.attach(xAxisInner)
    highlightedPart.parent.attach(yAxisCircle)
    highlightedPart.parent.attach(yAxisOuter)
    highlightedPart.parent.attach(yAxisInner)
    highlightedPart.parent.attach(zAxisCircle)
    highlightedPart.parent.attach(zAxisOuter)
    highlightedPart.parent.attach(zAxisInner)
    highlightedPart.parent.attach(xAxisLine)
    highlightedPart.parent.attach(yAxisLine)
    highlightedPart.parent.attach(zAxisLine)
    highlightedPart.parent.attach(xAxisClick)
    highlightedPart.parent.attach(yAxisClick)
    highlightedPart.parent.attach(zAxisClick)

    xAxisCircle.rotation.x = 0
    xAxisOuter.rotation.x = 0
    xAxisInner.rotation.x = 0

    yAxisCircle.rotation.x = Math.PI / 2
    yAxisOuter.rotation.x = Math.PI / 2
    yAxisInner.rotation.x = Math.PI / 2

    zAxisCircle.rotation.x = 0
    zAxisOuter.rotation.x = 0
    zAxisInner.rotation.x = 0

    xAxisCircle.rotation.y = highlightedPart.rotation.y + Math.PI / 2
    xAxisOuter.rotation.y = highlightedPart.rotation.y + Math.PI / 2
    xAxisInner.rotation.y = highlightedPart.rotation.y + Math.PI / 2

    yAxisCircle.rotation.y = 0
    yAxisOuter.rotation.y = 0
    yAxisInner.rotation.y = 0

    zAxisCircle.rotation.y = 0
    zAxisOuter.rotation.y = 0
    zAxisInner.rotation.y = 0

    xAxisCircle.rotation.z = highlightedPart.rotation.z
    xAxisOuter.rotation.z = highlightedPart.rotation.z
    xAxisInner.rotation.z = highlightedPart.rotation.z

    yAxisCircle.rotation.z = highlightedPart.rotation.z
    yAxisOuter.rotation.z = highlightedPart.rotation.z
    yAxisInner.rotation.z = highlightedPart.rotation.z

    zAxisCircle.rotation.z = 0
    zAxisOuter.rotation.z = 0
    zAxisInner.rotation.z = 0

    xAxisLine.rotation.x = 0
    xAxisLine.rotation.y = 0
    xAxisLine.rotation.z = Math.PI / 2
    xAxisClick.rotation.x = 0
    xAxisClick.rotation.y = 0
    xAxisClick.rotation.z = Math.PI / 2

    yAxisLine.rotation.x = 0
    yAxisLine.rotation.y = 0
    yAxisLine.rotation.z = 0
    yAxisClick.rotation.x = 0
    yAxisClick.rotation.y = 0
    yAxisClick.rotation.z = 0

    zAxisLine.rotation.x = Math.PI / 2
    zAxisLine.rotation.y = 0
    zAxisLine.rotation.z = 0
    zAxisClick.rotation.x = Math.PI / 2
    zAxisClick.rotation.y = 0
    zAxisClick.rotation.z = 0
}

export function startControls() {
    raycaster.setFromCamera(mouse, camera)

    const xOuter = raycaster.intersectObject(xAxisOuter)
    const xInner = raycaster.intersectObject(xAxisInner)
    const yOuter = raycaster.intersectObject(yAxisOuter)
    const yInner = raycaster.intersectObject(yAxisInner)
    const zOuter = raycaster.intersectObject(zAxisOuter)
    const zInner = raycaster.intersectObject(zAxisInner)
    const xLine = raycaster.intersectObject(xAxisClick)
    const yLine = raycaster.intersectObject(yAxisClick)
    const zLine = raycaster.intersectObject(zAxisClick)

    let x = 0,
        y = 0

    if (highlightedPart !== null) {
        let centerCoords = selectedScreenCoords()
        x = pMouse.x - centerCoords.x
        y = pMouse.y - centerCoords.y
    }

    if (highlightedPart !== null && xOuter.length > 0 && xInner.length == 0 && properties.rotatex.enabled()) {
        rotating = 'x'

        if (isFront(xAxisCircle)) {
            movementOrigin = actualHighlightedRotation[0] + Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[0] - Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && yOuter.length > 0 && yInner.length == 0 && properties.rotatey.enabled()) {
        rotating = 'y'

        if (isFront(yAxisCircle)) {
            movementOrigin = actualHighlightedRotation[1] - Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[1] + Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && zOuter.length > 0 && zInner.length == 0 && properties.rotatez.enabled()) {
        rotating = 'z'

        if (isFront(zAxisCircle)) {
            movementOrigin = actualHighlightedRotation[2] + Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[2] - Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && xLine.length > 0 && properties.translatex.enabled()) {
        translating = 'x'

        xAxisLine.updateMatrixWorld()
        target.setFromMatrixPosition(xAxisLine.matrixWorld)
        let pos1 = target.clone()
        pos1.x -= 0.001
        let pos2 = target.clone()
        pos2.x += 0.001

        let coords1 = posScreenCoords(pos1)
        let coords2 = posScreenCoords(pos2)

        movementAngle = getAngle(coords1, coords2)
        movementOrigin = rotateAroundOrigin(pMouse, movementAngle).x
        originalCoords.copy(highlightedPart.parent.position)
    } else if (highlightedPart !== null && yLine.length > 0 && properties.translatey.enabled()) {
        translating = 'y'

        yAxisLine.updateMatrixWorld()
        target.setFromMatrixPosition(yAxisLine.matrixWorld)
        let pos1 = target.clone()
        pos1.y -= 0.001
        let pos2 = target.clone()
        pos2.y += 0.001

        let coords1 = posScreenCoords(pos1)
        let coords2 = posScreenCoords(pos2)

        movementAngle = getAngle(coords1, coords2)
        movementOrigin = rotateAroundOrigin(pMouse, movementAngle).x
        originalCoords.copy(highlightedPart.parent.position)
    } else if (highlightedPart !== null && zLine.length > 0 && properties.translatez.enabled()) {
        translating = 'z'

        zAxisLine.updateMatrixWorld()
        target.setFromMatrixPosition(zAxisLine.matrixWorld)
        let pos1 = target.clone()
        pos1.z -= 0.001
        let pos2 = target.clone()
        pos2.z += 0.001

        let coords1 = posScreenCoords(pos1)
        let coords2 = posScreenCoords(pos2)

        movementAngle = getAngle(coords1, coords2)
        movementOrigin = rotateAroundOrigin(pMouse, movementAngle).x
        originalCoords.copy(highlightedPart.parent.position)
    }
}

// TODO fix compatibility with different window ratios
export function useControls() {
    if (highlightedPart !== null) {
        let centerCoords = selectedScreenCoords()

        const x = pMouse.x - centerCoords.x
        const y = pMouse.y - centerCoords.y

        if (rotating === 'x') {
            let prev = actualHighlightedRotation[0]
            if (isFront(xAxisCircle)) {
                highlightedPart.rotation.x = movementOrigin - Math.atan2(x, y)
                actualHighlightedRotation[0] = movementOrigin - Math.atan2(x, y)
            } else {
                highlightedPart.rotation.x = movementOrigin + Math.atan2(x, y)
                actualHighlightedRotation[0] = movementOrigin + Math.atan2(x, y)
            }

            if (codes.ShiftLeft) {
                let temp = actualHighlightedRotation[0]
                highlightedPart.rotation.x = Math.round(temp / snapAngle) * snapAngle
                actualHighlightedRotation[0] = Math.round(temp / snapAngle) * snapAngle
            }

            if (actualHighlightedRotation[0] < prev - 1.5 * Math.PI) {
                actualHighlightedRotation[0] += 2 * Math.PI
                movementOrigin += 2 * Math.PI
            }
            if (actualHighlightedRotation[0] > prev + 1.5 * Math.PI) {
                actualHighlightedRotation[0] -= 2 * Math.PI
                movementOrigin -= 2 * Math.PI
            }
        }
        if (rotating === 'y') {
            let prev = actualHighlightedRotation[1]
            if (isFront(yAxisCircle)) {
                highlightedPart.rotation.y = movementOrigin + Math.atan2(x, y)
                actualHighlightedRotation[1] = movementOrigin + Math.atan2(x, y)
            } else {
                highlightedPart.rotation.y = movementOrigin - Math.atan2(x, y)
                actualHighlightedRotation[1] = movementOrigin - Math.atan2(x, y)
            }

            if (codes.ShiftLeft) {
                let temp = actualHighlightedRotation[1]
                highlightedPart.rotation.y = Math.round(temp / snapAngle) * snapAngle
                actualHighlightedRotation[1] = Math.round(temp / snapAngle) * snapAngle
            }

            if (actualHighlightedRotation[1] < prev - 1.5 * Math.PI) {
                actualHighlightedRotation[1] += 2 * Math.PI
                movementOrigin += 2 * Math.PI
            }
            if (actualHighlightedRotation[1] > prev + 1.5 * Math.PI) {
                actualHighlightedRotation[1] -= 2 * Math.PI
                movementOrigin -= 2 * Math.PI
            }

            xAxisCircle.rotation.y = highlightedPart.rotation.y + Math.PI / 2
            xAxisOuter.rotation.y = highlightedPart.rotation.y + Math.PI / 2
            xAxisInner.rotation.y = highlightedPart.rotation.y + Math.PI / 2
        }
        if (rotating === 'z') {
            let prev = actualHighlightedRotation[2]
            if (isFront(zAxisCircle)) {
                highlightedPart.rotation.z = movementOrigin - Math.atan2(x, y)
                actualHighlightedRotation[2] = movementOrigin - Math.atan2(x, y)
            } else {
                highlightedPart.rotation.z = movementOrigin + Math.atan2(x, y)
                actualHighlightedRotation[2] = movementOrigin + Math.atan2(x, y)
            }

            if (codes.ShiftLeft) {
                let temp = actualHighlightedRotation[2]
                highlightedPart.rotation.z = Math.round(temp / snapAngle) * snapAngle
                actualHighlightedRotation[2] = Math.round(temp / snapAngle) * snapAngle
            }

            if (actualHighlightedRotation[2] < prev - 1.5 * Math.PI) {
                actualHighlightedRotation[2] += 2 * Math.PI
                movementOrigin += 2 * Math.PI
            }
            if (actualHighlightedRotation[2] > prev + 1.5 * Math.PI) {
                actualHighlightedRotation[2] -= 2 * Math.PI
                movementOrigin -= 2 * Math.PI
            }

            yAxisCircle.rotation.z = highlightedPart.rotation.z
            yAxisOuter.rotation.z = highlightedPart.rotation.z
            yAxisInner.rotation.z = highlightedPart.rotation.z

            xAxisCircle.rotation.z = highlightedPart.rotation.z
            xAxisOuter.rotation.z = highlightedPart.rotation.z
            xAxisInner.rotation.z = highlightedPart.rotation.z
        }

        // TODO reevaluate movementOrigin and originalCoord to avoid unpredictable behaviour
        // ? (such as jittering when moved close to the camera from far away)

        const delta = rotateAroundOrigin(pMouse, movementAngle).x - movementOrigin

        if (translating === 'x') {
            highlightedPart.parent.position.x = translatingFromDelta(delta, originalCoords.x)

            let coefficient = camera.position.distanceTo(highlightedPart.parent.position) * 1

            highlightedPart.parent.position.x = translatingFromDelta(delta * coefficient, originalCoords.x, true)
        }
        if (translating === 'y') {
            highlightedPart.parent.position.y = translatingFromDelta(delta, originalCoords.y)

            let coefficient = camera.position.distanceTo(highlightedPart.parent.position) * 1

            highlightedPart.parent.position.y = translatingFromDelta(delta * coefficient, originalCoords.y, true)
        }
        if (translating === 'z') {
            highlightedPart.parent.position.z = translatingFromDelta(delta, originalCoords.z)

            let coefficient = camera.position.distanceTo(highlightedPart.parent.position) * 1

            highlightedPart.parent.position.z = translatingFromDelta(delta * coefficient, originalCoords.z, true)
        }

        if (translating !== '') {
            saveTranslation(frame, highlightedPart, [
                highlightedPart.parent.position.x,
                highlightedPart.parent.position.y,
                highlightedPart.parent.position.z,
            ])
        }

        if (rotating !== '') {
            saveRotation(frame, highlightedPart, actualHighlightedRotation)
        }

        if (rotating !== '' || translating !== '') {
            updateKeyframeValues()
        }

        updateControls()
        highlightedPart.getWorldPosition(camOrbit)
    }
}

// TODO simplify this
function translatingFromDelta(delta: number, original: number, snap: boolean = false) {
    let temp = original + delta

    if (snap) {
        if (codes.ShiftLeft) {
            return round(temp / snapDistance) * snapDistance
        }
        if (codes.ControlLeft) {
            const snaps = [
                Math.round(temp - headSize / 2) + headSize / 2,
                Math.round(temp + headSize / 2) - headSize / 2,
                Math.round(temp - (headSize / 2 + 0.5)) + headSize / 2 + 0.5,
                Math.round(temp + (headSize / 2 + 0.5)) - (headSize / 2 + 0.5),
            ]

            let min = -1
            let closest = 0
            for (const snap of snaps) {
                if (Math.abs(temp - snap) < min || min === -1) {
                    min = Math.abs(temp - snap)
                    closest = snap
                }
            }

            return closest
        }
    }

    return temp
}

export function posScreenCoords(point: Vector3) {
    let pos = point.clone()
    pos.project(camera)

    return pos
}

export function selectedScreenCoords() {
    highlightedPart.getWorldPosition(target)
    const pos = posScreenCoords(target)
    pos.x = (pos.x * width) / height
    return pos
}

// TODO fix controls front/back side detection
export function isFront(plane: Mesh<CircleGeometry, MeshBasicMaterial>) {
    plane.updateMatrixWorld()

    const rotMat = new Matrix4()
    rotMat.extractRotation(plane.matrixWorld)

    targetQ.setFromRotationMatrix(rotMat)

    let planeVector = new Vector3(0, 0, 1).applyQuaternion(targetQ)
    let cameraVector = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)

    return planeVector.angleTo(cameraVector) > Math.PI / 2
}

export function rotateAroundOrigin(point: Vector2, angle: number) {
    let pointAngle = Math.atan2(point.x, point.y)
    let dist = Math.sqrt(point.x * point.x + point.y * point.y)

    pointAngle -= angle

    return new Vector2(Math.cos(pointAngle) * dist, Math.sin(pointAngle) * dist)
}

export function updateReferences() {
    point3D.scale.setScalar(camera.position.length() / 20)
    if (highlightedPart !== null) {
        grid.position.x = floor(getRootObject(highlightedPart).position.x + 0.5)
        grid.position.y = floor(getRootObject(highlightedPart).position.y + 0.5) - 0.001
        grid.position.z = floor(getRootObject(highlightedPart).position.z + 0.5)
    } else {
        grid.position.setScalar(0)
    }
}

export function select(part: Object3D) {
    loadSettings(part)

    selectedOutlinePassLine.selectedObjects = []

    setActualRotation()

    selectedOutlinePassLine.selectedObjects = [highlightedPart]

    highlightedPart.getWorldPosition(camOrbit)

    updateControls()

    updateAllKeyframes()

    deletePropertyInputs()
    createPropertyInputs(getHighlightedProperties())
    updateKeyframeValues()

    propertyInputDiv.childNodes.forEach((child, key, parent) => (child as HTMLElement).blur())
}

export function deselect() {
    selectedOutlinePassLine.selectedObjects = []

    resetControls()

    if (highlightedPart !== null) {
        searchInputElement.focus()
    }
    resetHighlightedPart()

    deletePropertyInputs()
    createPropertyInputs(getHighlightedProperties())
    updateKeyframeValues()
}

export function resetHighlightedPart() {
    highlightedPart = null
    resetActualRotation()
    resetPartFrameData()

    updateAllKeyframes()
}

export function initControls() {
    scene.add(xAxisLine)
    scene.add(xAxisClick)

    scene.add(yAxisLine)
    scene.add(yAxisClick)

    scene.add(zAxisLine)
    scene.add(zAxisClick)

    scene.add(xAxisCircle)
    scene.add(xAxisOuter)
    scene.add(xAxisInner)

    scene.add(yAxisCircle)
    scene.add(yAxisOuter)
    scene.add(yAxisInner)

    scene.add(zAxisCircle)
    scene.add(zAxisOuter)
    scene.add(zAxisInner)
}
