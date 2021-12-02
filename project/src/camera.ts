import { clamp } from 'lodash'
import { Matrix4, Object3D, PerspectiveCamera, Vector3 } from 'three'
import { camSpeed, codes, isMouseDown, mouseButton, sensitivity } from './input'
import { rotateSpherical } from './maths'
import { height, width } from './render'
import { target, targetF, targetQ, targetS } from './util'

export const camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
camera.rotation.order = 'ZYX'
camera.position.set(5, 5, 5)

export const insideCamera = new PerspectiveCamera(50, width / height, 0.1, 1000)
camera.rotation.order = 'ZYX'
camera.add(insideCamera)

export let camOrbit = new Vector3(0, 0, 0)

export function updateCamOrbit(part: Object3D) {
  part.getWorldPosition(camOrbit)
}

export function cameraControls(movementX: number, movementY: number) {
  if (mouseButton === 2) {
    let raw = camera.rotation.x - movementY * sensitivity
    camera.rotation.x = clamp(raw, -Math.PI / 2 + 0.0001, Math.PI / 2 - 0.0001)
    camera.rotation.y -= movementX * sensitivity
  } else if (mouseButton === 0) {
    if (!isOnScreen(camOrbit)) {
      targetQ.copy(camera.quaternion)
      lookAt(camera, camOrbit)
      camera.quaternion.slerp(targetQ, 0.99)
    }
    // ? don't forget this line exists lol
    // ? accidentally tried to fix a bug that didn't exist lmao
    camera.position.sub(camOrbit)

    const focus = camera.position.clone()
    let forward = new Vector3(0, 0, -focus.length() / 4)

    forward.applyQuaternion(camera.quaternion)

    focus.add(forward)

    targetS.setFromVector3(camera.position)
    rotateSpherical(targetS, movementY * sensitivity, movementX * sensitivity)

    let adjust = 0
    let tolerance = 0.01
    if (targetS.phi < tolerance) {
      adjust = tolerance - targetS.phi
    }
    if (targetS.phi > Math.PI - tolerance) {
      adjust = Math.PI - tolerance - targetS.phi
    }
    targetS.phi += adjust

    camera.position.setFromSpherical(targetS)
    camera.position.add(camOrbit)

    targetS.setFromVector3(focus)
    rotateSpherical(targetS, movementY * sensitivity, movementX * sensitivity)
    targetS.phi += adjust
    focus.setFromSpherical(targetS)
    focus.add(camOrbit)

    lookAt(camera, focus)
  } else if (mouseButton === 1) {
    target.x = -movementX * sensitivity
    target.y = movementY * sensitivity
    target.z = 0

    target.applyQuaternion(camera.quaternion)

    camera.position.add(target)
  }
}

export function movement() {
  if (isMouseDown && mouseButton === 2) {
    if (codes.KeyW) {
      let forward = new Vector3(0, 0, -camSpeed)
      forward.applyQuaternion(camera.quaternion)

      camera.position.add(forward)
    }
    if (codes.KeyS) {
      let back = new Vector3(0, 0, camSpeed)
      back.applyQuaternion(camera.quaternion)

      camera.position.add(back)
    }
    if (codes.KeyA) {
      let left = new Vector3(-camSpeed, 0, 0)
      left.applyQuaternion(camera.quaternion)

      camera.position.add(left)
    }
    if (codes.KeyD) {
      let right = new Vector3(camSpeed, 0, 0)
      right.applyQuaternion(camera.quaternion)

      camera.position.add(right)
    }
    if (codes.KeyE) {
      let right = new Vector3(0, camSpeed, 0)
      right.applyQuaternion(camera.quaternion)

      camera.position.add(right)
    }
    if (codes.KeyQ) {
      let right = new Vector3(0, -camSpeed, 0)
      right.applyQuaternion(camera.quaternion)

      camera.position.add(right)
    }
  }
}

export function lookAt(obj: PerspectiveCamera, focus: Vector3) {
  let offset = focus.clone()
  offset.sub(obj.position)

  obj.rotation.y = -Math.atan2(offset.x, -offset.z)
  obj.rotation.x = Math.atan2(offset.y, Math.sqrt(offset.x * offset.x + offset.z * offset.z))
  obj.rotation.z = 0
}

export function isOnScreen(point: Vector3) {
  insideCamera.updateMatrix()
  insideCamera.updateMatrixWorld()
  const projectionMatrix = insideCamera.projectionMatrix
  const matrixInverse = insideCamera.matrixWorldInverse

  targetF.setFromProjectionMatrix(new Matrix4().multiplyMatrices(projectionMatrix, matrixInverse))
  return targetF.containsPoint(point)
}

export function resetCamera() {
  camera.position.set(5, 5, 5)
  camOrbit.set(0, 0, 0)
  lookAt(camera, camOrbit)
}

lookAt(camera, new Vector3(0, 0, 0))
