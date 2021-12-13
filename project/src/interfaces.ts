import { Object3D } from 'three'

export interface FramePart {
    rotation?: number[]
    translation?: number[]
    skullowner?: string
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

export type ModelList = {
    [key: string]: string
}

export type Cubes = {
    [key: string]: { [key: string]: CubesObject } | Object3D[] | ModelList
    parts: Object3D[]
    models: ModelList
}

export type ModelShape = {
    to: number[]
    from: number[]
    position: number[]
    rotation: number[]
    uv: number[]
} & {
    [key: string]: string
}

export interface ModelPart {
    parts: ModelPart[]
    position: number[]
    rotation: number[]
    shapes: ModelShape[]
    name: string
}

export type Property = {
    [key: string]: string
}

export interface Freedom {
    rotate?: Property
    translate?: Property
}

export interface Setting {
    freedom?: Freedom
    armor?: Property
}

export type Settings = {
    [key: string]: Setting | undefined
    general?: Setting
}

export interface Codes {
    [key: string]: boolean
}

export interface Json {
    [x: string]: string | number | boolean | Date | Json | JsonArray
}
interface JsonArray extends Array<string | number | boolean | Date | Json | JsonArray> {}

export interface Tags {
    [key: string]: string | string[] | number | number[] | Tags | Tags[]
}
