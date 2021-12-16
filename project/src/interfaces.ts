import { Object3D } from 'three'

export type StringObject = { [key: string]: string }
export type NumberObject = { [key: string]: number }
export type BooleanObject = { [key: string]: boolean }

export interface FramePart {
    rotation?: number[]
    translation?: number[]
    skullowner?: string | Tags
    nbt?: string
    block?: string
}

export interface Frame {
    [key: string]: FramePart
}

export interface FrameData {
    [key: number]: Frame
}

export interface CubesChildren {
    [key: string]: CubesObject
}

export interface CubesObject {
    cubes: Object3D[]
    children: CubesChildren
}

export type Cubes = {
    parts: Object3D[]
    models: StringObject
    [key: string]: { [key: string]: CubesObject } | Object3D[] | StringObject
}

export type ModelShape = {
    to: number[]
    from: number[]
    position: number[]
    rotation: number[]
    uv: number[]
} & StringObject

export interface ModelPart {
    parts: ModelPart[]
    position: number[]
    rotation: number[]
    shapes: ModelShape[]
    name: string
}

export interface Freedom {
    rotate?: StringObject
    translate?: StringObject
}

export interface Setting {
    freedom?: Freedom
    armor?: StringObject
}

export type Settings = {
    [key: string]: Setting | undefined
    general?: Setting
}

export interface Json {
    [x: string]: string | number | boolean | Date | Json | JsonArray
}
interface JsonArray extends Array<string | number | boolean | Date | Json | JsonArray> {}

export type Tags =
    | {
          [key: string]: string | string[] | number | number[] | Tags | Tags[]
      }
    | string
    | number
