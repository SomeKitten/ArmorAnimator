import _, { clamp, round } from 'lodash'
import { Spherical, Vector3 } from 'three'
import { radToDeg } from 'three/src/math/MathUtils'

export function rotateSpherical(spherical: Spherical, angleX: number, angleY: number) {
    spherical.theta -= angleY
    spherical.phi -= angleX
}

export function rotateAroundOrigin3D(point: Vector3, angleX: number, angleY: number) {
    let spherical = new Spherical()
    spherical.setFromVector3(point)
    spherical.theta -= angleY
    spherical.phi = clamp(spherical.phi - angleX, 0.0001, Math.PI - 0.0001)

    point.setFromSpherical(spherical)
}

export function wrap(num: number, min: number, max: number) {
    if (num < min) num = max
    if (num > max) num = min
    return num
}

export function snap(vec3: { x: number; y: number; z: number }) {
    vec3.x = round(vec3.x)
    vec3.y = round(vec3.y)
    vec3.z = round(vec3.z)
}

export function getAngle(origin: { x: number; y: number }, point: { x: number; y: number }) {
    let dx = point.x - origin.x
    let dy = point.y - origin.y

    return Math.atan2(dx, dy)
}

export function radArrToDeg(arr: number[]) {
    const ret = []
    for (const num of arr) {
        ret.push(radToDeg(num))
    }
    return ret
}
