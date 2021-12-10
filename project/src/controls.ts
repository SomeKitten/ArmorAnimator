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
import { codes, mouse, searchInputElement } from './input'
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
} from './render'
import { getRootObject, scene, settings, target, targetQ } from './util'
import _, { floor, round } from 'lodash'
import { createPropertyInputs, deletePropertyInputs, propertyInputDiv, resetPropertyValues } from './menu'
import { updateAllKeyframes } from './keyframes'
import { getHighlightedProperties, updateKeyframeValues } from './properties'
import { camera, camOrbit } from './camera'

export const raycaster = new Raycaster()

export let canRotateX = false
export let canRotateY = false
export let canRotateZ = false
export let canTranslateX = false
export let canTranslateY = false
export let canTranslateZ = false
export let canWearHelmet = false

export let snapDistance = 0.25
export let snapAngle = Math.PI / 4

export let actualHighlightedRotation = [0, 0, 0]

export let rotating = ''
export let translating = ''

export let movementOrigin = 0
export let movementAngle = 0
export let originalCoord = 0

export let highlightedPart: Object3D = null

export function resetRotating() {
    rotating = ''
}

export function setCanRotate(setting: string) {
    canRotateX = setting.includes('X')
    canRotateY = setting.includes('Y')
    canRotateZ = setting.includes('Z')
}

export function resetTranslating() {
    translating = ''
}

export function setCanTranslate(setting: string) {
    canTranslateX = setting.includes('X')
    canTranslateY = setting.includes('Y')
    canTranslateZ = setting.includes('Z')
}

export function setCanWearArmor(setting: string) {
    canWearHelmet = setting.includes('H')
}

export function resetControls() {
    canRotateX = false
    canRotateY = false
    canRotateZ = false
    canTranslateX = false
    canTranslateY = false
    canTranslateZ = false
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
        x = mouse.x - centerCoords.x
        y = mouse.y - centerCoords.y
    }

    if (highlightedPart !== null && xOuter.length > 0 && xInner.length == 0 && canRotateX) {
        rotating = 'x'

        if (isFront(xAxisCircle)) {
            movementOrigin = actualHighlightedRotation[0] + Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[0] - Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && yOuter.length > 0 && yInner.length == 0 && canRotateY) {
        rotating = 'y'

        if (isFront(yAxisCircle)) {
            movementOrigin = actualHighlightedRotation[1] - Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[1] + Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && zOuter.length > 0 && zInner.length == 0 && canRotateZ) {
        rotating = 'z'

        if (isFront(zAxisCircle)) {
            movementOrigin = actualHighlightedRotation[2] + Math.atan2(x, y)
        } else {
            movementOrigin = actualHighlightedRotation[2] - Math.atan2(x, y)
        }
    } else if (highlightedPart !== null && xLine.length > 0 && canTranslateX) {
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
        movementOrigin = rotateAroundOrigin(mouse, movementAngle).x
        originalCoord = highlightedPart.parent.position.x
    } else if (highlightedPart !== null && yLine.length > 0 && canTranslateY) {
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
        movementOrigin = rotateAroundOrigin(mouse, movementAngle).x
        originalCoord = highlightedPart.parent.position.y
    } else if (highlightedPart !== null && zLine.length > 0 && canTranslateZ) {
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
        movementOrigin = rotateAroundOrigin(mouse, movementAngle).x
        originalCoord = highlightedPart.parent.position.z
    }
}

export function useControls() {
    if (highlightedPart !== null && document.getElementById('download') === null) {
        let centerCoords = selectedScreenCoords()
        let x = mouse.x - centerCoords.x
        let y = mouse.y - centerCoords.y

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

        const coefficient = Math.pow(camera.position.distanceTo(highlightedPart.parent.position), 15 / 16)
        const delta = (rotateAroundOrigin(mouse, movementAngle).x - movementOrigin) * coefficient

        if (translating === 'x') {
            highlightedPart.parent.position.x = originalCoord + delta

            if (codes.ShiftLeft) {
                let temp = highlightedPart.parent.position.x
                highlightedPart.parent.position.x = round(temp / snapDistance) * snapDistance
            }
        }
        if (translating === 'y') {
            highlightedPart.parent.position.y = originalCoord + delta

            if (codes.ShiftLeft) {
                let temp = highlightedPart.parent.position.y
                highlightedPart.parent.position.y = round(temp / snapDistance) * snapDistance
            }
        }
        if (translating === 'z') {
            highlightedPart.parent.position.z = originalCoord + delta

            if (codes.ShiftLeft) {
                let temp = highlightedPart.parent.position.z
                highlightedPart.parent.position.z = round(temp / snapDistance) * snapDistance
            }
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

export function posScreenCoords(point: Vector3) {
    let pos = point.clone()
    pos.project(camera)

    return pos
}

export function selectedScreenCoords() {
    highlightedPart.getWorldPosition(target)
    return posScreenCoords(target)
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
    while (!(canRotateX || canRotateY || canRotateZ || canTranslateX || canTranslateY || canTranslateZ)) {
        part = part.parent
        loadSettings(part)
    }

    selectedOutlinePassLine.selectedObjects = []

    highlightedPart = part
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

    composer.removePass(xRotateOutline)
    composer.removePass(yRotateOutline)
    composer.removePass(zRotateOutline)

    composer.removePass(xTranslateOutline)
    composer.removePass(yTranslateOutline)
    composer.removePass(zTranslateOutline)

    if (highlightedPart !== null) {
        resetPropertyValues()
        searchInputElement.focus()
    }
    resetHighlightedPart()

    deletePropertyInputs()
    createPropertyInputs(getHighlightedProperties())
    updateKeyframeValues()

    propertyInputDiv.childNodes.forEach((child, key, parent) => (child as HTMLElement).blur())
}

// TODO change the load*Settings() functions into one singular one that uses lodash get() function
export function loadSettings(part: Object3D) {
    loadRotateSettings(part)
    loadTranslateSettings(part)
    loadArmorSettings(part)
}

export function loadRotateSettings(part: Object3D) {
    let entity = part.name.split('|')[0]
    let partName = part.name.split('|')[2]

    if (
        settings[entity] !== undefined &&
        settings[entity].freedom !== undefined &&
        settings[entity].freedom.rotate !== undefined &&
        settings[entity].freedom.rotate[partName] !== undefined
    ) {
        setCanRotate(settings[entity].freedom.rotate[partName])
    } else if (settings.general.freedom.rotate[partName] !== undefined) {
        setCanRotate(settings.general.freedom.rotate[partName])
    } else {
        setCanRotate(settings.general.freedom.rotate.general)
    }
}

export function loadTranslateSettings(part: Object3D) {
    let entity = part.name.split('|')[0]
    let partName = part.name.split('|')[2]

    if (
        settings[entity] !== undefined &&
        settings[entity].freedom !== undefined &&
        settings[entity].freedom.translate !== undefined &&
        settings[entity].freedom.translate[partName] !== undefined
    ) {
        setCanTranslate(settings[entity].freedom.translate[partName])
    } else if (settings.general.freedom.translate[partName] !== undefined) {
        setCanTranslate(settings.general.freedom.translate[partName])
    } else {
        setCanTranslate(settings.general.freedom.translate.general)
    }
}

export function loadArmorSettings(part: Object3D) {
    let entity = part.name.split('|')[0]
    let partName = part.name.split('|')[2]

    if (
        settings[entity] !== undefined &&
        settings[entity].armor !== undefined &&
        settings[entity].armor[partName] !== undefined
    ) {
        setCanWearArmor(settings[entity].armor[partName])
    } else if (settings.general.armor[partName] !== undefined) {
        setCanWearArmor(settings.general.armor[partName])
    } else {
        setCanWearArmor(settings.general.armor.general)
    }
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
